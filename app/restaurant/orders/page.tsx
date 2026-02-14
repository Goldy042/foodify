import Link from "next/link";
import { redirect } from "next/navigation";
import { OrderStatus } from "@/app/generated/prisma/client";

import prisma from "@/lib/prisma";
import { AppHeader } from "@/components/app/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/app/lib/pricing";
import { requireRestaurantAccess } from "@/app/restaurant/_lib/access";

type PageProps = {
  searchParams?:
    | Promise<{ status?: string; error?: string }>
    | { status?: string; error?: string };
};

const statusLabels: Record<OrderStatus, string> = {
  PLACED: "Placed",
  PAID: "Paid",
  FAILED_PAYMENT: "Failed Payment",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  PREPARING: "Preparing",
  READY_FOR_PICKUP: "Ready for Pickup",
  DRIVER_ASSIGNED: "Driver Assigned",
  PICKED_UP: "Picked Up",
  EN_ROUTE: "En Route",
  DELIVERED: "Delivered",
};

const successMessages: Record<string, string> = {
  "order-accepted": "Order accepted.",
  "order-rejected": "Order rejected.",
  "order-preparing": "Order moved to preparing.",
  "order-ready": "Order marked ready for pickup.",
};

const errorMessages: Record<string, string> = {
  "order-not-found": "Order could not be found for this restaurant.",
  "invalid-transition": "This order can no longer move to that status.",
};

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  PLACED: ["ACCEPTED", "REJECTED"],
  PAID: ["ACCEPTED", "REJECTED"],
  FAILED_PAYMENT: [],
  ACCEPTED: ["PREPARING"],
  REJECTED: [],
  PREPARING: ["READY_FOR_PICKUP"],
  READY_FOR_PICKUP: [],
  DRIVER_ASSIGNED: [],
  PICKED_UP: [],
  EN_ROUTE: [],
  DELIVERED: [],
};

function canTransition(from: OrderStatus, to: OrderStatus) {
  return allowedTransitions[from].includes(to);
}

function orderPriority(status: OrderStatus) {
  switch (status) {
    case "PLACED":
    case "PAID":
      return 1;
    case "ACCEPTED":
    case "PREPARING":
      return 2;
    case "READY_FOR_PICKUP":
      return 3;
    case "DRIVER_ASSIGNED":
    case "PICKED_UP":
    case "EN_ROUTE":
      return 4;
    case "DELIVERED":
    case "REJECTED":
    case "FAILED_PAYMENT":
      return 5;
    default:
      return 6;
  }
}

export default async function RestaurantOrdersPage({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const access = await requireRestaurantAccess("MANAGE_ORDERS");
  const restaurantId = access.restaurantId;

  async function transitionOrder(formData: FormData) {
    "use server";

    const authedAccess = await requireRestaurantAccess("MANAGE_ORDERS");
    const authedRestaurantId = authedAccess.restaurantId;

    const orderId = String(formData.get("orderId") || "").trim();
    const nextStatus = String(formData.get("nextStatus") || "").trim() as OrderStatus;

    if (!orderId || !nextStatus) {
      redirect("/restaurant/orders?error=order-not-found");
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        restaurantId: authedRestaurantId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!order) {
      redirect("/restaurant/orders?error=order-not-found");
    }

    if (!canTransition(order.status, nextStatus)) {
      redirect("/restaurant/orders?error=invalid-transition");
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { status: nextStatus },
    });

    if (nextStatus === "ACCEPTED") {
      redirect("/restaurant/orders?status=order-accepted");
    }
    if (nextStatus === "REJECTED") {
      redirect("/restaurant/orders?status=order-rejected");
    }
    if (nextStatus === "PREPARING") {
      redirect("/restaurant/orders?status=order-preparing");
    }
    if (nextStatus === "READY_FOR_PICKUP") {
      redirect("/restaurant/orders?status=order-ready");
    }

    redirect("/restaurant/orders");
  }

  const orders = await prisma.order.findMany({
    where: {
      restaurantId,
    },
    orderBy: [{ createdAt: "desc" }],
    include: {
      customer: {
        select: {
          fullName: true,
        },
      },
      items: {
        include: {
          menuItem: {
            select: { name: true },
          },
        },
      },
    },
  });

  const prioritizedOrders = [...orders].sort((a, b) => {
    const statusWeightDiff = orderPriority(a.status) - orderPriority(b.status);
    if (statusWeightDiff !== 0) {
      return statusWeightDiff;
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const inboxOrders = prioritizedOrders.filter((order) =>
    order.status === "PLACED" || order.status === "PAID"
  );
  const kitchenOrders = prioritizedOrders.filter((order) =>
    order.status === "ACCEPTED" || order.status === "PREPARING"
  );
  const readyOrders = prioritizedOrders.filter((order) => order.status === "READY_FOR_PICKUP");
  const deliveryOrders = prioritizedOrders.filter((order) =>
    order.status === "DRIVER_ASSIGNED" ||
    order.status === "PICKED_UP" ||
    order.status === "EN_ROUTE"
  );

  const doneOrders = prioritizedOrders.filter((order) =>
    order.status === "DELIVERED" ||
    order.status === "REJECTED" ||
    order.status === "FAILED_PAYMENT"
  );

  const statusMessage = resolvedSearchParams.status
    ? successMessages[resolvedSearchParams.status]
    : null;
  const errorMessage = resolvedSearchParams.error
    ? errorMessages[resolvedSearchParams.error]
    : null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Restaurant</p>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                Orders Hub
              </h1>
              <p className="text-sm text-muted-foreground">
                Track incoming orders and move them through your fulfillment pipeline.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/restaurant">Back to dashboard</Link>
            </Button>
          </div>
        </header>

        {statusMessage ? (
          <div className="rounded-lg border border-emerald-300/60 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {statusMessage}
          </div>
        ) : null}
        {errorMessage ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border/70 shadow-sm">
            <CardContent className="space-y-1 py-4">
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Inbox</p>
              <p className="text-3xl font-semibold">{inboxOrders.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardContent className="space-y-1 py-4">
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Kitchen</p>
              <p className="text-3xl font-semibold">{kitchenOrders.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardContent className="space-y-1 py-4">
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Ready</p>
              <p className="text-3xl font-semibold">{readyOrders.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardContent className="space-y-1 py-4">
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Delivery</p>
              <p className="text-3xl font-semibold">{deliveryOrders.length}</p>
            </CardContent>
          </Card>
        </div>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Inbox</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {inboxOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No new orders waiting.</p>
              ) : (
                inboxOrders.map((order) => (
                  <div key={order.id} className="rounded-lg border border-border/70 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{order.customer.fullName}</p>
                      <span className="text-xs text-muted-foreground">
                        {statusLabels[order.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {order.items.length} item{order.items.length === 1 ? "" : "s"} |{" "}
                      {formatCurrency(Number(order.total))}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <form action={transitionOrder}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="nextStatus" value="ACCEPTED" />
                        <Button type="submit" size="sm">
                          Accept
                        </Button>
                      </form>
                      <form action={transitionOrder}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="nextStatus" value="REJECTED" />
                        <Button type="submit" size="sm" variant="outline">
                          Reject
                        </Button>
                      </form>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Kitchen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {kitchenOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active kitchen orders.</p>
              ) : (
                kitchenOrders.map((order) => (
                  <div key={order.id} className="rounded-lg border border-border/70 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{order.customer.fullName}</p>
                      <span className="text-xs text-muted-foreground">
                        {statusLabels[order.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatCurrency(Number(order.total))}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {order.status === "ACCEPTED" ? (
                        <form action={transitionOrder}>
                          <input type="hidden" name="orderId" value={order.id} />
                          <input type="hidden" name="nextStatus" value="PREPARING" />
                          <Button type="submit" size="sm">
                            Start prep
                          </Button>
                        </form>
                      ) : null}
                      {order.status === "PREPARING" ? (
                        <form action={transitionOrder}>
                          <input type="hidden" name="orderId" value={order.id} />
                          <input type="hidden" name="nextStatus" value="READY_FOR_PICKUP" />
                          <Button type="submit" size="sm">
                            Mark ready
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Ready and Delivery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[...readyOrders, ...deliveryOrders].length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No orders in pickup or delivery state.
                </p>
              ) : (
                [...readyOrders, ...deliveryOrders].map((order) => (
                  <div key={order.id} className="rounded-lg border border-border/70 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{order.customer.fullName}</p>
                      <span className="text-xs text-muted-foreground">
                        {statusLabels[order.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Confirmation code: {order.deliveryConfirmationCode}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Completed / Closed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {doneOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No completed or closed orders yet.</p>
              ) : (
                doneOrders.slice(0, 10).map((order) => (
                  <div key={order.id} className="rounded-lg border border-border/70 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{order.customer.fullName}</p>
                      <span className="text-xs text-muted-foreground">
                        {statusLabels[order.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatCurrency(Number(order.total))}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
