import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserFromSession } from "@/app/lib/session";
import { Role } from "@/app/generated/prisma/client";
import { listCustomerOrders } from "@/app/lib/db";
import { formatCurrency } from "@/app/lib/pricing";

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
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Orders
          </p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                Your recent orders.
              </h1>
              <p className="text-sm text-muted-foreground">
                Track your latest activity and order statuses.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/customer">Browse restaurants</Link>
            </Button>
          </div>
        </header>

        {orders.length === 0 ? (
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">No orders yet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Place your first order to see it here.
              </p>
              <Button asChild>
                <Link href="/customer">Start ordering</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="border-border/70 shadow-sm">
                <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                      Order {order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-base font-semibold">
                      {order.restaurant.restaurantName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(order.createdAt)} • Status {order.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold">
                      {formatCurrency(Number(order.total))}
                    </span>
                    <Button asChild variant="outline">
                      <Link href={`/customer/orders/${order.id}`}>
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
