"use client";

import { calculateFees } from "./pricing";

const CART_KEY = "foodify_cart";
export const CART_UPDATED_EVENT = "foodify:cart-updated";
export const MIN_CART_QUANTITY = 1;
export const MAX_CART_QUANTITY = 99;

export type CartItemModifier = {
  id: string;
  name: string;
  priceDelta: number;
  quantity: number;
  includedQuantity: number;
};

export type CartItem = {
  lineId: string;
  menuItemId: string;
  measurementId: string;
  name: string;
  measurementUnit: string;
  unitPrice: number;
  quantity: number;
  modifiers: CartItemModifier[];
};

export type Cart = {
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
};

type AddToCartInput = {
  menuItemId: string;
  measurementId: string;
  name: string;
  measurementUnit: string;
  unitPrice: number;
  quantity: number;
  modifiers?: CartItemModifier[];
};

type AddToCartStatus = "added" | "merged" | "replaced" | "cancelled" | "invalid";

export type AddToCartResult = {
  cart: Cart | null;
  status: AddToCartStatus;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function clampQuantity(value: number) {
  const rounded = Math.floor(value);
  if (!Number.isFinite(rounded)) {
    return MIN_CART_QUANTITY;
  }
  if (rounded < MIN_CART_QUANTITY) {
    return MIN_CART_QUANTITY;
  }
  if (rounded > MAX_CART_QUANTITY) {
    return MAX_CART_QUANTITY;
  }
  return rounded;
}

function normalizeModifiers(input: unknown): CartItemModifier[] {
  if (!Array.isArray(input)) {
    return [];
  }
  const uniqueById = new Map<string, CartItemModifier>();
  for (const entry of input) {
    if (!isObjectLike(entry)) {
      continue;
    }
    const id = entry.id;
    const name = entry.name;
    const priceDelta = entry.priceDelta;
    const quantity = entry.quantity;
    const includedQuantity = entry.includedQuantity;
    if (
      !isNonEmptyString(id) ||
      !isNonEmptyString(name) ||
      typeof priceDelta !== "number" ||
      !Number.isFinite(priceDelta) ||
      typeof quantity !== "number" ||
      !Number.isFinite(quantity) ||
      typeof includedQuantity !== "number" ||
      !Number.isFinite(includedQuantity)
    ) {
      continue;
    }
    const parsedQuantity = Math.floor(quantity);
    const parsedIncluded = Math.max(0, Math.floor(includedQuantity));
    if (parsedQuantity < 1) {
      continue;
    }
    uniqueById.set(id, {
      id,
      name,
      priceDelta,
      quantity: parsedQuantity,
      includedQuantity: parsedIncluded,
    });
  }
  return Array.from(uniqueById.values());
}

function buildLineIdFromParts(
  menuItemId: string,
  measurementId: string,
  modifiers: CartItemModifier[]
) {
  const modifierIds = modifiers
    .map((modifier) => `${modifier.id}:${modifier.quantity}`)
    .sort()
    .join("-");
  return `${menuItemId}:${measurementId}:${modifierIds}`;
}

function buildLineId(input: AddToCartInput, modifiers: CartItemModifier[]) {
  return buildLineIdFromParts(input.menuItemId, input.measurementId, modifiers);
}

function normalizeCart(raw: unknown): Cart | null {
  if (!isObjectLike(raw)) {
    return null;
  }
  const restaurantId = raw.restaurantId;
  const restaurantName = raw.restaurantName;
  const itemsRaw = raw.items;

  if (
    !isNonEmptyString(restaurantId) ||
    !isNonEmptyString(restaurantName) ||
    !Array.isArray(itemsRaw)
  ) {
    return null;
  }

  const mergedItems = new Map<string, CartItem>();

  for (const entry of itemsRaw) {
    if (!isObjectLike(entry)) {
      continue;
    }
    const menuItemId = entry.menuItemId;
    const measurementId = entry.measurementId;
    const name = entry.name;
    const measurementUnit = entry.measurementUnit;
    const unitPrice = entry.unitPrice;
    const quantityRaw = entry.quantity;
    const modifiers = normalizeModifiers(entry.modifiers);

    if (
      !isNonEmptyString(menuItemId) ||
      !isNonEmptyString(measurementId) ||
      !isNonEmptyString(name) ||
      !isNonEmptyString(measurementUnit) ||
      typeof unitPrice !== "number" ||
      !Number.isFinite(unitPrice) ||
      typeof quantityRaw !== "number" ||
      !Number.isFinite(quantityRaw)
    ) {
      continue;
    }

    const quantity = clampQuantity(quantityRaw);
    const lineId = buildLineIdFromParts(menuItemId, measurementId, modifiers);
    const existing = mergedItems.get(lineId);
    if (!existing) {
      mergedItems.set(lineId, {
        lineId,
        menuItemId,
        measurementId,
        name,
        measurementUnit,
        unitPrice,
        quantity,
        modifiers,
      });
      continue;
    }
    mergedItems.set(lineId, {
      ...existing,
      quantity: clampQuantity(existing.quantity + quantity),
    });
  }

  const items = Array.from(mergedItems.values());
  if (items.length === 0) {
    return null;
  }

  return {
    restaurantId,
    restaurantName,
    items,
  };
}

export function getCart(): Cart | null {
  if (!canUseStorage()) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    const normalized = normalizeCart(parsed);
    if (!normalized) {
      window.localStorage.removeItem(CART_KEY);
      return null;
    }
    if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
      window.localStorage.setItem(CART_KEY, JSON.stringify(normalized));
    }
    return normalized;
  } catch {
    window.localStorage.removeItem(CART_KEY);
    return null;
  }
}

export function setCart(cart: Cart | null) {
  if (!canUseStorage()) {
    return;
  }

  const normalized = cart ? normalizeCart(cart) : null;
  if (!normalized) {
    window.localStorage.removeItem(CART_KEY);
    window.dispatchEvent(new Event(CART_UPDATED_EVENT));
    return;
  }

  window.localStorage.setItem(CART_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export function clearCart() {
  setCart(null);
}

export function addToCart(
  restaurant: { id: string; name: string },
  input: AddToCartInput,
  confirmReplace = true
): AddToCartResult {
  if (
    !isNonEmptyString(restaurant.id) ||
    !isNonEmptyString(restaurant.name) ||
    !isNonEmptyString(input.menuItemId) ||
    !isNonEmptyString(input.measurementId) ||
    !isNonEmptyString(input.name) ||
    !isNonEmptyString(input.measurementUnit) ||
    !Number.isFinite(input.unitPrice) ||
    !Number.isFinite(input.quantity)
  ) {
    return { cart: getCart(), status: "invalid" };
  }

  if (input.quantity <= 0) {
    return { cart: getCart(), status: "invalid" };
  }

  const modifiers = normalizeModifiers(input.modifiers ?? []);
  const nextLineId = buildLineId(input, modifiers);
  const nextItem: CartItem = {
    lineId: nextLineId,
    menuItemId: input.menuItemId,
    measurementId: input.measurementId,
    name: input.name,
    measurementUnit: input.measurementUnit,
    unitPrice: input.unitPrice,
    quantity: clampQuantity(input.quantity),
    modifiers,
  };

  const current = getCart();
  if (!current) {
    const nextCart: Cart = {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      items: [nextItem],
    };
    setCart(nextCart);
    return { cart: nextCart, status: "added" };
  }

  if (current.restaurantId !== restaurant.id) {
    if (confirmReplace) {
      const currentCount = current.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      const proceed = window.confirm(
        `Your cart has ${currentCount} item${currentCount === 1 ? "" : "s"} from ${current.restaurantName}. Start a new cart for ${restaurant.name}?`
      );
      if (!proceed) {
        return { cart: current, status: "cancelled" };
      }
    }
    const nextCart: Cart = {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      items: [nextItem],
    };
    setCart(nextCart);
    return { cart: nextCart, status: "replaced" };
  }

  const existingIndex = current.items.findIndex(
    (item) => item.lineId === nextLineId
  );
  const nextItems = [...current.items];
  let status: AddToCartStatus = "added";

  if (existingIndex >= 0) {
    const existing = nextItems[existingIndex];
    nextItems[existingIndex] = {
      ...existing,
      quantity: clampQuantity(existing.quantity + nextItem.quantity),
    };
    status = "merged";
  } else {
    nextItems.push(nextItem);
  }

  const nextCart = normalizeCart({
    restaurantId: current.restaurantId,
    restaurantName: current.restaurantName,
    items: nextItems,
  });
  setCart(nextCart);
  return { cart: nextCart, status };
}

export function updateCartItemQuantity(lineId: string, quantity: number) {
  const current = getCart();
  if (!current) {
    return null;
  }
  if (!Number.isFinite(quantity)) {
    return current;
  }

  const nextItems = current.items.flatMap((item) => {
    if (item.lineId !== lineId) {
      return [item];
    }
    if (quantity <= 0) {
      return [];
    }
    return [{ ...item, quantity: clampQuantity(quantity) }];
  });

  const nextCart = normalizeCart({
    ...current,
    items: nextItems,
  });
  setCart(nextCart);
  return nextCart;
}

export function removeCartItem(lineId: string) {
  const current = getCart();
  if (!current) {
    return null;
  }

  const nextCart = normalizeCart({
    ...current,
    items: current.items.filter((item) => item.lineId !== lineId),
  });
  setCart(nextCart);
  return nextCart;
}

export function getLineTotal(item: CartItem) {
  const modifiersTotal = item.modifiers.reduce(
    (sum, modifier) =>
      sum +
      Math.max(0, modifier.quantity - modifier.includedQuantity) *
        modifier.priceDelta,
    0
  );
  return Number(((item.unitPrice + modifiersTotal) * item.quantity).toFixed(2));
}

export function getCartTotals(cart: Cart | null) {
  if (!cart) {
    return calculateFees(0);
  }
  const itemsSubtotal = cart.items.reduce(
    (sum, item) => sum + getLineTotal(item),
    0
  );
  return calculateFees(Number(itemsSubtotal.toFixed(2)));
}
