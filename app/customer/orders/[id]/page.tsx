import { notFound, redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getUserFromSession } from "@/app/lib/session";
import { Role } from "@/app/generated/prisma/client";
import { getCustomerOrder, measurementEnumToLabel } from "@/app/lib/db";
import { formatCurrency } from "@/app/lib/pricing";
import { ClearCartOnLoad } from "../clear-cart";
import Link from "next/link";
import { simulatePayment } from "@/app/lib/order-actions";

type PageProps = {
  params: Promise<{ id: string }> | { id: string };
  searchParams?: Promise<{ placed?: string; paid?: string; error?: string }> | {
    placed?: string;
    paid?: string;
    error?: string;
  };
};

export default async function CustomerOrderPage({
  params,
  searchParams,
}: PageProps) {
  const resolvedParams = await params;
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

  const order = await getCustomerOrder(resolvedParams.id, user.id);
  if (!order) {
    notFound();
  }

  const errorMessages: Record<string, string> = {
    "not-found": "This order could not be found.",
    "invalid-status": "This order is no longer eligible for payment.",
  };
  const errorMessage = resolvedSearchParams.error
    ? errorMessages[resolvedSearchParams.error]
    : null;

  const showPaymentActions =
    order.status === "PLACED" || order.status === "FAILED_PAYMENT";
  const showDeliveryCode = ["PICKED_UP", "EN_ROUTE", "DELIVERED"].includes(
    order.status
  );
  const showTracking = ["PAID", "ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "DRIVER_ASSIGNED", "PICKED_UP", "EN_ROUTE", "DELIVERED"].includes(
    order.status
  );
  const timeline = [
    "PLACED",
    "PAID",
    "ACCEPTED",
    "PREPARING",
    "READY_FOR_PICKUP",
    "DRIVER_ASSIGNED",
    "PICKED_UP",
    "EN_ROUTE",
    "DELIVERED",
  ];
  const currentIndex = timeline.indexOf(order.status);
  const statusLabel = (status: string) =>
    status
      .split("_")
      .map((part) => part[0] + part.slice(1).toLowerCase())
      .join(" ");

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-16">
        {resolvedSearchParams.placed ? <ClearCartOnLoad /> : null}
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Order placed
          </p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                Order {order.id.slice(0, 8).toUpperCase()}
              </h1>
              <p className="text-sm text-muted-foreground">
                Status: {order.status}
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/customer/orders">Back to orders</Link>
            </Button>
          </div>
        </header>

        {errorMessage ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        {resolvedSearchParams.paid ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Payment received. The restaurant will confirm your order shortly.
          </div>
        ) : null}

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 border-b border-border/70 pb-4 last:border-b-0 last:pb-0"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.menuItem.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {measurementEnumToLabel[item.measurementUnit]} • Qty{" "}
                      {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-semibold">
                    {formatCurrency(Number(item.lineTotal))}
                  </span>
                </div>
                {item.modifiers.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {item.modifiers
                      .map((modifier) => modifier.modifierOption.name)
                      .join(", ")}
                  </p>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>

        {showTracking ? (
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Order tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="grid gap-3 text-sm">
                {timeline.map((status, index) => {
                  const isComplete = currentIndex >= index;
                  return (
                    <li
                      key={status}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                        isComplete
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-border/70 text-muted-foreground"
                      }`}
                    >
                      <span className="text-xs uppercase tracking-[0.3em]">
                        {index + 1}
                      </span>
                      <span className="font-medium">{statusLabel(status)}</span>
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>
        ) : null}

        {showDeliveryCode ? (
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Delivery confirmation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Share this code with your driver to complete delivery.
              </p>
              <div className="rounded-lg border border-border/70 bg-muted/40 px-4 py-3 text-center text-2xl font-semibold tracking-[0.4em]">
                {order.deliveryConfirmationCode}
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <span>{order.payment?.status ?? "UNPAID"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Provider</span>
              <span>{order.payment?.provider ?? "Not started"}</span>
            </div>
            {order.payment?.providerReference ? (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Reference</span>
                <span>{order.payment.providerReference}</span>
              </div>
            ) : null}
            {showPaymentActions ? (
              <div className="flex flex-col gap-3 sm:flex-row">
                <form action={simulatePayment} className="w-full">
                  <input type="hidden" name="orderId" value={order.id} />
                  <input type="hidden" name="outcome" value="success" />
                  <Button type="submit" className="w-full">
                    Pay now (demo)
                  </Button>
                </form>
                <form action={simulatePayment} className="w-full">
                  <input type="hidden" name="orderId" value={order.id} />
                  <input type="hidden" name="outcome" value="failed" />
                  <Button type="submit" variant="outline" className="w-full">
                    Simulate failure
                  </Button>
                </form>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Payment is locked once the order moves beyond placement.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Items subtotal</span>
              <span>{formatCurrency(Number(order.itemsSubtotal))}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Service fee</span>
              <span>{formatCurrency(Number(order.serviceFee))}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Delivery fee</span>
              <span>{formatCurrency(Number(order.deliveryFee))}</span>
            </div>
            <div className="h-px w-full bg-border/70" />
            <div className="flex items-center justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatCurrency(Number(order.total))}</span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
