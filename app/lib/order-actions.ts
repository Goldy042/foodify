"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@/app/generated/prisma/client";

import prisma from "@/lib/prisma";
import { getUserFromSession } from "@/app/lib/session";
import { getCustomerProfile } from "@/app/lib/db";
import { calculateFees } from "@/app/lib/pricing";
import { generateToken } from "@/app/lib/auth";

type CartPayload = {
  restaurantId: string;
  items: Array<{
    menuItemId: string;
    measurementId: string;
    quantity: number;
    modifiers?: Array<{ id: string }>;
  }>;
};

type ParsedCartResult = {
  cart: CartPayload;
  hadInvalidItems: boolean;
};

function generateDeliveryCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function toDecimal(value: number) {
  return new Prisma.Decimal(value.toFixed(2));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseCart(raw: string): ParsedCartResult | null {
  try {
    const parsed = JSON.parse(raw) as {
      restaurantId?: unknown;
      items?: unknown;
    };
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    const restaurantId = parsed.restaurantId;
    const itemsInput = parsed.items;

    if (!isNonEmptyString(restaurantId) || !Array.isArray(itemsInput)) {
      return null;
    }

    let hadInvalidItems = false;
    const items: CartPayload["items"] = [];

    for (const item of itemsInput) {
      if (!item || typeof item !== "object") {
        hadInvalidItems = true;
        continue;
      }

      const candidate = item as {
        menuItemId?: unknown;
        measurementId?: unknown;
        quantity?: unknown;
        modifiers?: unknown;
      };

      if (
        !isNonEmptyString(candidate.menuItemId) ||
        !isNonEmptyString(candidate.measurementId) ||
        !Number.isFinite(candidate.quantity)
      ) {
        hadInvalidItems = true;
        continue;
      }

      let modifiers: Array<{ id: string }> | undefined;
      if (Array.isArray(candidate.modifiers)) {
        const validModifiers = candidate.modifiers
          .filter(
            (modifier) =>
              modifier &&
              typeof modifier === "object" &&
              isNonEmptyString((modifier as { id?: unknown }).id)
          )
          .map((modifier) => ({ id: (modifier as { id: string }).id }));

        if (validModifiers.length !== candidate.modifiers.length) {
          hadInvalidItems = true;
        }
        if (validModifiers.length > 0) {
          modifiers = validModifiers;
        }
      } else if (candidate.modifiers !== undefined) {
        hadInvalidItems = true;
      }

      items.push({
        menuItemId: candidate.menuItemId,
        measurementId: candidate.measurementId,
        quantity: Number(candidate.quantity),
        ...(modifiers ? { modifiers } : {}),
      });
    }

    return {
      cart: {
        restaurantId,
        items,
      },
      hadInvalidItems,
    };
  } catch {
    return null;
  }
}

export async function placeOrder(formData: FormData) {
  const cartRaw = String(formData.get("cart") || "");
  if (!cartRaw) {
    redirect("/customer/cart?error=empty-cart");
  }

  const parsedCart = parseCart(cartRaw);
  if (!parsedCart || parsedCart.cart.items.length === 0) {
    redirect("/customer/cart?error=empty-cart");
  }
  if (parsedCart.hadInvalidItems) {
    redirect("/customer/cart?error=invalid-item");
  }

  const cart = parsedCart.cart;

  const user = await getUserFromSession();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "CUSTOMER") {
    redirect(`/onboarding/${user.role.toLowerCase()}`);
  }
  if (user.status === "EMAIL_UNVERIFIED") {
    redirect(`/signup/verify?email=${encodeURIComponent(user.email)}`);
  }
  if (user.status !== "PROFILE_COMPLETED") {
    redirect("/onboarding/customer");
  }

  const profile = await getCustomerProfile(user.id);
  if (!profile) {
    redirect("/onboarding/customer");
  }

  const restaurant = await prisma.restaurantProfile.findFirst({
    where: {
      id: cart.restaurantId,
      user: {
        status: "APPROVED",
        isSuspended: false,
      },
    },
  });

  if (!restaurant) {
    redirect("/customer/cart?error=invalid-restaurant");
  }

  const menuItemIds = Array.from(
    new Set(cart.items.map((item) => item.menuItemId))
  );

  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: menuItemIds },
      restaurantId: restaurant.id,
    },
    include: {
      measurements: true,
      modifierGroups: { include: { options: true } },
    },
  });

  if (menuItems.length !== menuItemIds.length) {
    redirect("/customer/cart?error=invalid-item");
  }

  const itemCreates: Prisma.OrderItemCreateWithoutOrderInput[] = [];
  let itemsSubtotal = 0;

  for (const item of cart.items) {
    const menuItem = menuItems.find((entry) => entry.id === item.menuItemId);
    if (!menuItem) {
      redirect("/customer/cart?error=invalid-item");
    }
    if (!item.measurementId) {
      redirect("/customer/cart?error=invalid-item");
    }

    const measurement = menuItem.measurements.find(
      (entry) => entry.id === item.measurementId
    );
    if (!measurement) {
      redirect("/customer/cart?error=invalid-measurement");
    }

    const quantity = Number.isFinite(item.quantity)
      ? Math.max(1, Math.floor(item.quantity))
      : 1;

    const selections = item.modifiers?.map((modifier) => modifier.id) ?? [];
    const selectionSet = new Set(selections);
    const matchedOptionIds = new Set<string>();

    const selectedOptions = menuItem.modifierGroups.flatMap((group) => {
      const options = group.options.filter((option) =>
        selectionSet.has(option.id)
      );
      options.forEach((option) => matchedOptionIds.add(option.id));
      if (group.isRequired && options.length === 0) {
        redirect("/customer/cart?error=missing-modifier");
      }
      if (options.length > group.maxSelections) {
        redirect("/customer/cart?error=invalid-modifier");
      }
      return options.map((option) => ({
        id: option.id,
        priceDelta: Number(option.priceDelta),
      }));
    });

    if (matchedOptionIds.size !== selectionSet.size) {
      redirect("/customer/cart?error=invalid-modifier");
    }

    const modifiersTotal = selectedOptions.reduce(
      (sum, option) => sum + option.priceDelta,
      0
    );
    const unitPrice = Number(measurement.basePrice);
    const lineTotal = Number(
      ((unitPrice + modifiersTotal) * quantity).toFixed(2)
    );
    itemsSubtotal += lineTotal;

    itemCreates.push({
      menuItem: {
        connect: { id: menuItem.id },
      },
      measurementUnit: measurement.unit,
      quantity,
      unitPrice: toDecimal(unitPrice),
      lineTotal: toDecimal(lineTotal),
      modifiers: {
        create: selectedOptions.map((option) => ({
          modifierOptionId: option.id,
          priceDelta: toDecimal(option.priceDelta),
        })),
      },
    });
  }

  const feeTotals = calculateFees(Number(itemsSubtotal.toFixed(2)));

  const order = await prisma.order.create({
    data: {
      customerId: user.id,
      restaurantId: restaurant.id,
      deliveryAddressText: profile.defaultAddressText,
      deliveryLat: profile.defaultAddressLat,
      deliveryLng: profile.defaultAddressLng,
      itemsSubtotal: toDecimal(feeTotals.itemsSubtotal),
      deliveryFee: toDecimal(feeTotals.deliveryFee),
      serviceFee: toDecimal(feeTotals.serviceFee),
      total: toDecimal(feeTotals.total),
      status: "PLACED",
      deliveryConfirmationCode: generateDeliveryCode(),
      items: {
        create: itemCreates,
      },
    },
  });

  redirect(`/customer/orders/${order.id}?placed=1`);
}

export async function simulatePayment(formData: FormData) {
  const orderId = String(formData.get("orderId") || "");
  const outcome = String(formData.get("outcome") || "success");
  if (!orderId) {
    redirect("/customer/cart?error=empty-cart");
  }

  const user = await getUserFromSession();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "CUSTOMER") {
    redirect(`/onboarding/${user.role.toLowerCase()}`);
  }
  if (user.status === "EMAIL_UNVERIFIED") {
    redirect(`/signup/verify?email=${encodeURIComponent(user.email)}`);
  }
  if (user.status !== "PROFILE_COMPLETED") {
    redirect("/onboarding/customer");
  }

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      customerId: user.id,
    },
    include: {
      payment: true,
    },
  });

  if (!order) {
    redirect(`/customer/orders/${orderId}?error=not-found`);
  }

  if (!["PLACED", "FAILED_PAYMENT"].includes(order.status)) {
    redirect(`/customer/orders/${orderId}?error=invalid-status`);
  }

  const paymentStatus = outcome === "success" ? "SUCCESS" : "FAILED";
  const orderStatus = outcome === "success" ? "PAID" : "FAILED_PAYMENT";

  const providerReference =
    order.payment?.providerReference ?? `demo_${generateToken(10)}`;

  await prisma.$transaction(async (tx) => {
    if (order.payment) {
      await tx.payment.update({
        where: { id: order.payment.id },
        data: {
          provider: "demo",
          providerReference,
          status: paymentStatus,
          amount: order.total,
        },
      });
    } else {
      await tx.payment.create({
        data: {
          orderId: order.id,
          provider: "demo",
          providerReference,
          status: paymentStatus,
          amount: order.total,
        },
      });
    }

    await tx.order.update({
      where: { id: order.id },
      data: { status: orderStatus },
    });
  });

  redirect(`/customer/orders/${order.id}?paid=1`);
}
