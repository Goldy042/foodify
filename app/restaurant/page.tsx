import Link from "next/link";

import prisma from "@/lib/prisma";
import { AppHeader } from "@/components/app/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatus } from "@/app/generated/prisma/client";
import { prepTimeEnumToLabel } from "@/app/lib/db";
import { formatCurrency } from "@/app/lib/pricing";
import { parseTimeToMinutes } from "@/app/lib/restaurant-availability";
import { requireRestaurantAccess } from "@/app/restaurant/_lib/access";

const LIVE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PLACED,
  OrderStatus.PAID,
  OrderStatus.ACCEPTED,
  OrderStatus.PREPARING,
  OrderStatus.READY_FOR_PICKUP,
  OrderStatus.DRIVER_ASSIGNED,
  OrderStatus.PICKED_UP,
  OrderStatus.EN_ROUTE,
];

const BILLABLE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.ACCEPTED,
  OrderStatus.PREPARING,
  OrderStatus.READY_FOR_PICKUP,
  OrderStatus.DRIVER_ASSIGNED,
  OrderStatus.PICKED_UP,
  OrderStatus.EN_ROUTE,
  OrderStatus.DELIVERED,
];

const orderStatusLabel: Record<OrderStatus, string> = {
  [OrderStatus.PLACED]: "Placed",
  [OrderStatus.PAID]: "Paid",
  [OrderStatus.FAILED_PAYMENT]: "Failed Payment",
  [OrderStatus.ACCEPTED]: "Accepted",
  [OrderStatus.REJECTED]: "Rejected",
  [OrderStatus.PREPARING]: "Preparing",
  [OrderStatus.READY_FOR_PICKUP]: "Ready for Pickup",
  [OrderStatus.DRIVER_ASSIGNED]: "Driver Assigned",
  [OrderStatus.PICKED_UP]: "Picked Up",
  [OrderStatus.EN_ROUTE]: "En Route",
  [OrderStatus.DELIVERED]: "Delivered",
};

function toMoney(value: unknown) {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof value === "bigint") {
    return Number(value);
  }
  return 0;
}

export default async function RestaurantDashboardPage() {
  const access = await requireRestaurantAccess("VIEW_DASHBOARD");
  const user = access.user;

  const restaurant = await prisma.restaurantProfile.findUnique({
    where: { id: access.restaurantId },
    select: {
      id: true,
      restaurantName: true,
      logoUrl: true,
      phoneNumber: true,
      streetAddress: true,
      cuisineTypes: true,
      openTime: true,
      closeTime: true,
      prepTimeRange: true,
      _count: {
        select: {
          menuItems: true,
          staffMembers: true,
          orders: true,
        },
      },
    },
  });

  if (!restaurant) {
    return null;
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [liveOrdersCount, todayOrderMetrics, sevenDayOrderMetrics, recentOrders, sellableMenuItemsCount, invalidPricingSetupItemsCount] =
    await Promise.all([
      prisma.order.count({
        where: {
          restaurantId: restaurant.id,
          status: { in: LIVE_ORDER_STATUSES },
        },
      }),
      prisma.order.aggregate({
        where: {
          restaurantId: restaurant.id,
          status: { in: BILLABLE_ORDER_STATUSES },
          createdAt: { gte: startOfToday },
        },
        _count: { _all: true },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: {
          restaurantId: restaurant.id,
          status: { in: BILLABLE_ORDER_STATUSES },
          createdAt: { gte: sevenDaysAgo },
        },
        _count: { _all: true },
        _sum: { total: true },
      }),
      prisma.order.findMany({
        where: { restaurantId: restaurant.id },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          status: true,
          total: true,
          createdAt: true,
          customer: {
            select: {
              fullName: true,
            },
          },
        },
      }),
      prisma.menuItem.count({
        where: {
          restaurantId: restaurant.id,
          isAvailable: true,
          measurements: { some: { basePrice: { gt: 0 } } },
        },
      }),
      prisma.menuItem.count({
        where: {
          restaurantId: restaurant.id,
          measurements: { none: { basePrice: { gt: 0 } } },
        },
      }),
    ]);

  const todayRevenue = toMoney(todayOrderMetrics._sum.total);
  const sevenDayRevenue = toMoney(sevenDayOrderMetrics._sum.total);
  const hasMissingProfileInfo =
    !restaurant.logoUrl.trim() ||
    !restaurant.phoneNumber.trim() ||
    !restaurant.streetAddress.trim() ||
    restaurant.cuisineTypes.length === 0 ||
    parseTimeToMinutes(restaurant.openTime) === null ||
    parseTimeToMinutes(restaurant.closeTime) === null;

  const alerts: string[] = [];
  if (user.status !== "APPROVED") {
    alerts.push("Your restaurant is not yet fully approved. Some visibility limits may apply.");
  }
  if (restaurant._count.menuItems === 0) {
    alerts.push("No menu items published yet. Add at least one item to start receiving orders.");
  } else if (sellableMenuItemsCount === 0) {
    alerts.push("No sellable menu items are visible to customers right now.");
  }
  if (hasMissingProfileInfo) {
    alerts.push("Some critical profile fields are incomplete. Update them in restaurant settings.");
  }
  if (invalidPricingSetupItemsCount > 0) {
    alerts.push(`${invalidPricingSetupItemsCount} menu item${invalidPricingSetupItemsCount === 1 ? "" : "s"} have invalid or missing measurement pricing.`);
  }
  if (restaurant._count.staffMembers === 0) {
    alerts.push("No staff members added yet. Invite staff to help with daily operations.");
  }
  if (liveOrdersCount > 0) {
    alerts.push(`${liveOrdersCount} live order${liveOrdersCount === 1 ? "" : "s"} need active monitoring.`);
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Restaurant Dashboard</p>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                {restaurant.restaurantName}
              </h1>
              <p className="text-sm text-muted-foreground">
                Hours {restaurant.openTime} - {restaurant.closeTime} | Prep {prepTimeEnumToLabel[restaurant.prepTimeRange]}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/restaurant/orders">Open orders hub</Link>
              </Button>
              <Button asChild>
                <Link href="/restaurant/menu">Manage menu</Link>
              </Button>
            </div>
          </div>
        </header>

        {alerts.length > 0 ? (
          <Card className="border-amber-300/70 bg-amber-50/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Operational alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-amber-900">
              {alerts.map((alert) => (
                <p key={alert}>- {alert}</p>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-border/70 shadow-sm">
            <CardContent className="space-y-1 py-5">
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Live Orders</p>
              <p className="text-3xl font-semibold">{liveOrdersCount}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardContent className="space-y-1 py-5">
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Today</p>
              <p className="text-3xl font-semibold">{todayOrderMetrics._count._all}</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(todayRevenue)} revenue</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardContent className="space-y-1 py-5">
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Last 7 Days</p>
              <p className="text-3xl font-semibold">{sevenDayOrderMetrics._count._all}</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(sevenDayRevenue)} revenue</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardContent className="space-y-1 py-5">
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Menu Coverage</p>
              <p className="text-3xl font-semibold">
                {sellableMenuItemsCount}/{restaurant._count.menuItems}
              </p>
              <p className="text-xs text-muted-foreground">sellable items</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No orders yet. Once customers place orders, they will show here.
                </p>
              ) : (
                recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{order.customer.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.createdAt.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        {orderStatusLabel[order.status]}
                      </p>
                      <p className="text-sm font-semibold">
                        {formatCurrency(toMoney(order.total))}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <Button asChild variant="outline" className="justify-start">
                <Link href="/restaurant/orders">Process incoming orders</Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/restaurant/menu">Add or update menu items</Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/restaurant/staff">Manage staff</Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/restaurant/settings">Update restaurant settings</Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/restaurant/workspace">Open legacy workspace tools</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
