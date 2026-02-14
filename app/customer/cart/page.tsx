import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserFromSession } from "@/app/lib/session";
import { Role } from "@/app/generated/prisma/client";
import { CartClient } from "./cart-client";
import { AppHeader } from "@/components/app/app-header";

const errorMessages: Record<string, string> = {
  "empty-cart": "Your cart is empty. Add items before placing an order.",
  "invalid-restaurant":
    "That restaurant is no longer available. Please start a new cart.",
  "restaurant-closed":
    "This restaurant is currently closed. You can place your order during open hours.",
  "outside-service-area":
    "This restaurant is outside your delivery service area. Please choose a closer restaurant.",
  "invalid-item": "One or more items are no longer available.",
  "unavailable-item":
    "One or more selected items are currently unavailable. Please review your cart.",
  "invalid-measurement": "Please reselect item sizes before checking out.",
  "missing-modifier": "Select required modifiers before placing the order.",
  "invalid-modifier": "Modifier selections are not valid for an item.",
};

type PageProps = {
  searchParams?: Promise<{ error?: string }> | { error?: string };
};

export default async function CustomerCartPage({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const user = await getUserFromSession();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== Role.CUSTOMER) {
    redirect(`/onboarding/${user.role.toLowerCase()}`);
  }
  if (user.status === "EMAIL_UNVERIFIED") {
    redirect(`/signup/verify?email=${encodeURIComponent(user.email)}`);
  }
  if (user.status !== "PROFILE_COMPLETED") {
    redirect("/onboarding/customer");
  }

  const errorMessage = resolvedSearchParams.error
    ? errorMessages[resolvedSearchParams.error]
    : null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_hsl(30_95%_94%),_hsl(36_38%_98%)_42%,_hsl(36_26%_99%))]">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 md:py-10">
        <section className="relative overflow-hidden rounded-3xl border border-orange-200/70 bg-gradient-to-br from-orange-500 via-amber-400 to-rose-400 p-6 text-white shadow-lg md:p-8">
          <div className="pointer-events-none absolute -right-20 -top-12 h-44 w-44 rounded-full bg-white/25 blur-3xl" />
          <div className="relative space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-white/80">
              Checkout
            </p>
            <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
              Review your bag and place your order.
            </h1>
            <p className="max-w-2xl text-sm text-white/90">
              Confirm quantities, fees, and add-ons before payment.
            </p>
          </div>
        </section>

        {errorMessage ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <Card className="border-border/70 bg-card/90 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl">Order details</CardTitle>
          </CardHeader>
          <CardContent>
            <CartClient />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}


