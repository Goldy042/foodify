"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  CART_UPDATED_EVENT,
  Cart,
  getCart,
  getCartTotals,
} from "@/app/lib/cart";
import { formatCurrency } from "@/app/lib/pricing";

type CartStickySummaryProps = {
  restaurantId: string;
};

function getItemCount(cart: Cart) {
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function CartStickySummary({ restaurantId }: CartStickySummaryProps) {
  const [cart, setCart] = React.useState<Cart | null>(null);

  React.useEffect(() => {
    const syncCart = () => {
      setCart(getCart());
    };

    syncCart();
    window.addEventListener("storage", syncCart);
    window.addEventListener(CART_UPDATED_EVENT, syncCart);
    return () => {
      window.removeEventListener("storage", syncCart);
      window.removeEventListener(CART_UPDATED_EVENT, syncCart);
    };
  }, []);

  if (!cart || cart.items.length === 0) {
    return null;
  }

  const itemCount = getItemCount(cart);
  const totals = getCartTotals(cart);
  const fromCurrentRestaurant = cart.restaurantId === restaurantId;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          {fromCurrentRestaurant ? (
            <>
              <p className="truncate text-sm font-semibold">
                {itemCount} item{itemCount === 1 ? "" : "s"} in cart
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {formatCurrency(totals.total)}
              </p>
            </>
          ) : (
            <>
              <p className="truncate text-sm font-semibold">
                Cart from {cart.restaurantName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Start a new cart by adding an item here
              </p>
            </>
          )}
        </div>
        <Button asChild size="sm">
          <Link href="/customer/cart">View cart</Link>
        </Button>
      </div>
    </div>
  );
}
