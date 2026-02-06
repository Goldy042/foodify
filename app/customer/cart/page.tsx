import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserFromSession } from "@/app/lib/session";
import { Role } from "@/app/generated/prisma/client";
import { CartClient } from "./cart-client";

const errorMessages: Record<string, string> = {
  "empty-cart": "Your cart is empty. Add items before placing an order.",
  "invalid-restaurant":
    "That restaurant is no longer available. Please start a new cart.",
  "invalid-item": "One or more items are no longer available.",
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
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Cart
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Review your order.
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Check item quantities and pricing before you checkout.
          </p>
        </header>

        {errorMessage ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <Card className="border-border/70 shadow-sm">
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
