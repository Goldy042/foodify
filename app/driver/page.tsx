import Link from "next/link";
import { OrderStatus } from "@/app/generated/prisma/client";

import { AppHeader } from "@/components/app/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listDriverAssignments } from "@/app/lib/db";
import { requireDriverAccess } from "@/app/driver/_lib/access";
import prisma from "@/lib/prisma";

const ACTIVE_DRIVER_STATUSES: OrderStatus[] = [
  OrderStatus.DRIVER_ASSIGNED,
  OrderStatus.PICKED_UP,
  OrderStatus.EN_ROUTE,
];

export default async function DriverDashboardPage() {
  const { user } = await requireDriverAccess();

  const [assignments, payoutCount] = await Promise.all([
    listDriverAssignments(user.id, 30),
    prisma.payoutLedgerEntry.count({
      where: {
        recipientType: "DRIVER",
        recipientId: user.id,
      },
    }),
  ]);

  const pendingAssignments = assignments.filter(
    (assignment) =>
      !assignment.acceptedAt &&
      !assignment.rejectedAt &&
      assignment.order.status === "DRIVER_ASSIGNED"
  );
  const activeAssignments = assignments.filter(
    (assignment) =>
      Boolean(assignment.acceptedAt) &&
      !assignment.rejectedAt &&
      ACTIVE_DRIVER_STATUSES.includes(assignment.order.status)
  );
  const completedAssignments = assignments.filter(
    (assignment) =>
      Boolean(assignment.rejectedAt) || assignment.order.status === "DELIVERED"
  );

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Rider Dashboard
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Welcome back, {user.fullName}.
          </h1>
          <p className="text-sm text-muted-foreground">
            Review assignment workload and jump into delivery actions.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border/70 shadow-sm">
            <CardContent className="space-y-1 py-5">
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                Pending
              </p>
              <p className="text-3xl font-semibold">{pendingAssignments.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardContent className="space-y-1 py-5">
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                Active
              </p>
              <p className="text-3xl font-semibold">{activeAssignments.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardContent className="space-y-1 py-5">
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                Completed
              </p>
              <p className="text-3xl font-semibold">{completedAssignments.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardContent className="space-y-1 py-5">
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                Payouts
              </p>
              <p className="text-3xl font-semibold">{payoutCount}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Assignment Operations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Accept or reject new jobs, update pickup/en-route status, and
                complete delivery with confirmation code.
              </p>
              <Button asChild>
                <Link href="/driver/assignments">Open assignments</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Earnings and Payouts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                View payout ledger entries created after confirmed deliveries.
              </p>
              <Button asChild variant="outline">
                <Link href="/driver/payouts">Open payouts</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm md:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl">Profile and Service Areas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Update your service areas, vehicle details, and payout account from your profile page.
              </p>
              <Button asChild variant="outline">
                <Link href="/driver/profile">Edit rider profile</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
