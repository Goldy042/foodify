"use client";

import { calculateFees } from "./pricing";

const CART_KEY = "foodify_cart";

export type CartItemModifier = {
  id: string;
  name: string;
  priceDelta: number;
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

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function buildLineId(input: AddToCartInput) {
  const modifierIds = (input.modifiers ?? [])
    .map((modifier) => modifier.id)
    .sort()
    .join("-");
  return `${input.menuItemId}:${input.measurementId}:${modifierIds}`;
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
    return JSON.parse(raw) as Cart;
  } catch {
    return null;
  }
}

export function setCart(cart: Cart | null) {
  if (!canUseStorage()) {
    return;
  }
  if (!cart) {
    window.localStorage.removeItem(CART_KEY);
    return;
  }
  window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function clearCart() {
  setCart(null);
}

export function addToCart(
  restaurant: { id: string; name: string },
  input: AddToCartInput,
  confirmReplace = true
) {
  const nextLineId = buildLineId(input);
  const nextItem: CartItem = {
    lineId: nextLineId,
    menuItemId: input.menuItemId,
    measurementId: input.measurementId,
    name: input.name,
    measurementUnit: input.measurementUnit,
    unitPrice: input.unitPrice,
    quantity: input.quantity,
    modifiers: input.modifiers ?? [],
  };

  const current = getCart();
  if (!current) {
    const nextCart: Cart = {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      items: [nextItem],
    };
    setCart(nextCart);
    return nextCart;
  }

  if (current.restaurantId !== restaurant.id) {
    if (confirmReplace) {
      const proceed = window.confirm(
        "Your cart has items from another restaurant. Start a new cart?"
      );
      if (!proceed) {
        return current;
      }
    }
    const nextCart: Cart = {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      items: [nextItem],
    };
    setCart(nextCart);
    return nextCart;
  }

  const existingIndex = current.items.findIndex(
    (item) => item.lineId === nextLineId
  );
  const nextItems = [...current.items];
  if (existingIndex >= 0) {
    const existing = nextItems[existingIndex];
    nextItems[existingIndex] = {
      ...existing,
      quantity: existing.quantity + input.quantity,
    };
  } else {
    nextItems.push(nextItem);
  }

  const nextCart = { ...current, items: nextItems };
  setCart(nextCart);
  return nextCart;
}

export function updateCartItemQuantity(lineId: string, quantity: number) {
  const current = getCart();
  if (!current) {
    return null;
  }
  const nextItems = current.items
    .map((item) =>
      item.lineId === lineId
        ? { ...item, quantity: Math.max(1, Math.floor(quantity)) }
        : item
    )
    .filter((item) => item.quantity > 0);
  const nextCart = { ...current, items: nextItems };
  setCart(nextCart);
  return nextCart;
}

export function removeCartItem(lineId: string) {
  const current = getCart();
  if (!current) {
    return null;
  }
  const nextItems = current.items.filter((item) => item.lineId !== lineId);
  const nextCart = { ...current, items: nextItems };
  setCart(nextCart);
  return nextCart;
}

export function getLineTotal(item: CartItem) {
  const modifiersTotal = item.modifiers.reduce(
    (sum, modifier) => sum + modifier.priceDelta,
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
