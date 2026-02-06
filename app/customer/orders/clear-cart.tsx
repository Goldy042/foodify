"use client";

import { useEffect } from "react";

import { clearCart } from "@/app/lib/cart";

export function ClearCartOnLoad() {
  useEffect(() => {
    clearCart();
  }, []);

  return null;
}
