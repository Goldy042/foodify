import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserFromSession } from "@/app/lib/session";
import { Role } from "@/app/generated/prisma/client";
import { listCustomerOrders } from "@/app/lib/db";
import { formatCurrency } from "@/app/lib/pricing";
import { AppHeader } from "@/components/app/app-header";

function formatDate(value: Date) {
  return value.toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function CustomerOrdersPage() {
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

  const orders = await listCustomerOrders(user.id);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_hsl(30_96%_94%),_hsl(36_38%_98%)_40%,_hsl(36_26%_99%))]">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-16 pt-8 sm:px-6">
        <section className="relative overflow-hidden rounded-3xl border border-orange-200/70 bg-gradient-to-br from-orange-500 via-amber-400 to-rose-400 p-6 text-white shadow-lg md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-40 w-40 rounded-full bg-white/25 blur-3xl" />
          <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-white/80">
                Orders
              </p>
              <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                Track every order from one place.
              </h1>
              <p className="text-sm text-white/90">
                See payment state, live progress, and your latest history.
              </p>
            </div>
            <Button asChild variant="secondary" className="bg-white/95 text-zinc-900">
              <Link href="/app">Browse restaurants</Link>
            </Button>
          </div>
        </section>

        {orders.length === 0 ? (
          <Card className="border-border/60 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">No orders yet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Place your first order to see it here.
              </p>
              <Button asChild>
                <Link href="/app">Start ordering</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {orders.map((order) => (
              <Card
                key={order.id}
                className="border-border/60 bg-card/90 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <CardContent className="space-y-4 py-4">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                      Order {order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-base font-semibold">
                      {order.restaurant.restaurantName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(order.createdAt)} | Status {order.status}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold">
                      {formatCurrency(Number(order.total))}
                    </span>
                    <Button asChild variant="outline">
                      <Link href={`/app/orders/${order.id}`}>
                        View details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
