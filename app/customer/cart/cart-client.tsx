"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  CART_UPDATED_EVENT,
  MAX_CART_QUANTITY,
  MIN_CART_QUANTITY,
  Cart,
  clearCart,
  getCart,
  getCartTotals,
  getLineTotal,
  removeCartItem,
  updateCartItemQuantity,
} from "@/app/lib/cart";
import { formatCurrency } from "@/app/lib/pricing";
import { measurementEnumToLabel } from "@/app/lib/labels";
import Link from "next/link";
import { placeOrder } from "@/app/lib/order-actions";

export function CartClient() {
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

  const handleQuantityUpdate = React.useCallback(
    (lineId: string, quantity: number) => {
      const next = updateCartItemQuantity(lineId, quantity);
      setCart(next);
    },
    []
  );

  const totals = React.useMemo(() => getCartTotals(cart), [cart]);
  const cartPayload = React.useMemo(
    () => (cart ? JSON.stringify(cart) : ""),
    [cart]
  );

  if (!cart || cart.items.length === 0) {
    return (
      <Card className="border-border/60 bg-card/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Your cart is empty</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Add items from a restaurant menu to get started.
          </p>
          <Button asChild>
            <Link href="/restaurants">Browse restaurants</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Items</h2>
            <p className="text-sm text-muted-foreground">
              {cart.restaurantName}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              clearCart();
              setCart(null);
            }}
          >
            Clear cart
          </Button>
        </div>

        <div className="space-y-4">
          {cart.items.map((item) => (
            <Card
              key={item.lineId}
              className="border-border/60 bg-background/80 shadow-sm"
            >
              <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {measurementEnumToLabel[item.measurementUnit] ??
                      item.measurementUnit}
                  </p>
                  {item.modifiers.length > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {item.modifiers
                        .map((modifier) => {
                          const extraQty = Math.max(
                            0,
                            modifier.quantity - modifier.includedQuantity
                          );
                          const priceLabel =
                            extraQty > 0
                              ? ` (+${formatCurrency(
                                  extraQty * modifier.priceDelta
                                )})`
                              : "";
                          return `${modifier.name} x${modifier.quantity}${priceLabel}`;
                        })
                        .join(", ")}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleQuantityUpdate(item.lineId, item.quantity - 1)
                      }
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      min={0}
                      max={MAX_CART_QUANTITY}
                      className="w-20"
                      value={item.quantity}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        handleQuantityUpdate(
                          item.lineId,
                          Number.isFinite(value) ? value : item.quantity
                        );
                      }}
                      onBlur={(event) => {
                        const value = Number(event.target.value);
                        handleQuantityUpdate(
                          item.lineId,
                          Number.isFinite(value)
                            ? Math.min(
                                MAX_CART_QUANTITY,
                                Math.max(MIN_CART_QUANTITY, value)
                              )
                            : item.quantity
                        );
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleQuantityUpdate(item.lineId, item.quantity + 1)
                      }
                    >
                      +
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {formatCurrency(getLineTotal(item))}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setCart(removeCartItem(item.lineId));
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <aside className="space-y-4">
        <Card className="border-border/60 bg-card/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Items subtotal</span>
              <span>{formatCurrency(totals.itemsSubtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Service fee</span>
              <span>{formatCurrency(totals.serviceFee)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Delivery fee</span>
              <span>{formatCurrency(totals.deliveryFee)}</span>
            </div>
            <div className="h-px w-full bg-border/70" />
            <div className="flex items-center justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatCurrency(totals.total)}</span>
            </div>
            <form action={placeOrder} className="space-y-3">
              <input type="hidden" name="cart" value={cartPayload} />
              <Button className="w-full" type="submit">
                Place order
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-background/80 shadow-sm">
          <CardContent className="space-y-2 py-4 text-xs text-muted-foreground">
            <p>
              Delivery and service fees are estimates while we finalize pricing
              rules.
            </p>
            <p>Modifiers are applied at item-level pricing.</p>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
