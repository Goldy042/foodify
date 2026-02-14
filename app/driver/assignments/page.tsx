import { OrderStatus } from "@/app/generated/prisma/client";

import { AppHeader } from "@/components/app/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listDriverAssignments } from "@/app/lib/db";
import { requireDriverAccess } from "@/app/driver/_lib/access";
import {
  acceptAssignment,
  confirmOrderDelivery,
  markOrderEnRoute,
  markOrderPickedUp,
  rejectAssignment,
} from "@/app/lib/driver-actions";

const ACTIVE_DRIVER_STATUSES: OrderStatus[] = [
  OrderStatus.DRIVER_ASSIGNED,
  OrderStatus.PICKED_UP,
  OrderStatus.EN_ROUTE,
];

const statusMessages: Record<string, string> = {
  "assignment-accepted": "Assignment accepted.",
  "assignment-rejected": "Assignment rejected.",
  "picked-up": "Order marked as picked up.",
  "en-route": "Order marked as en route.",
  "delivery-confirmed": "Delivery confirmed successfully.",
};

const errorMessages: Record<string, string> = {
  "assignment-not-found": "Assignment no longer exists.",
  "assignment-rejected": "This assignment has already been rejected.",
  "assignment-already-accepted": "This assignment has already been accepted.",
  "assignment-not-active": "Assignment is not active for delivery updates.",
  "invalid-order-status": "Order cannot be updated from its current status.",
  "invalid-code-format": "Enter a valid 4-digit delivery code.",
  "invalid-delivery-code": "Delivery code does not match the customer code.",
  unexpected: "Something went wrong. Try again.",
};

type PageProps = {
  searchParams?:
    | Promise<{ status?: string; error?: string }>
    | { status?: string; error?: string };
};

export default async function DriverAssignmentsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const { user } = await requireDriverAccess();

  const assignments = await listDriverAssignments(user.id, 40);
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
  const historyAssignments = assignments.filter(
    (assignment) =>
      Boolean(assignment.rejectedAt) || assignment.order.status === "DELIVERED"
  );

  const statusMessage = resolvedSearchParams.status
    ? statusMessages[resolvedSearchParams.status]
    : null;
  const errorMessage = resolvedSearchParams.error
    ? errorMessages[resolvedSearchParams.error]
    : null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Rider Assignments
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Assignment Inbox
          </h1>
          <p className="text-sm text-muted-foreground">
            Receive orders, accept jobs, and push delivery status updates.
          </p>
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

        <section className="grid gap-6 xl:grid-cols-3">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Pending</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No pending assignments.
                </p>
              ) : (
                pendingAssignments.map((assignment) => (
                  <div key={assignment.id} className="rounded-lg border border-border/70 p-3">
                    <p className="text-sm font-medium">
                      {assignment.order.restaurant.restaurantName}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Order #{assignment.order.id.slice(0, 8)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {assignment.order.deliveryAddressText}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <form action={acceptAssignment}>
                        <input type="hidden" name="assignmentId" value={assignment.id} />
                        <Button type="submit" size="sm">
                          Accept
                        </Button>
                      </form>
                      <form action={rejectAssignment}>
                        <input type="hidden" name="assignmentId" value={assignment.id} />
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
              <CardTitle className="text-xl">Active</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No active deliveries.
                </p>
              ) : (
                activeAssignments.map((assignment) => (
                  <div key={assignment.id} className="rounded-lg border border-border/70 p-3">
                    <p className="text-sm font-medium">
                      {assignment.order.restaurant.restaurantName}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {assignment.order.status.replaceAll("_", " ")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {assignment.order.deliveryAddressText}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {assignment.order.status === "DRIVER_ASSIGNED" ? (
                        <form action={markOrderPickedUp}>
                          <input type="hidden" name="orderId" value={assignment.order.id} />
                          <Button type="submit" size="sm">
                            Mark picked up
                          </Button>
                        </form>
                      ) : null}
                      {assignment.order.status === "PICKED_UP" ? (
                        <form action={markOrderEnRoute}>
                          <input type="hidden" name="orderId" value={assignment.order.id} />
                          <Button type="submit" size="sm">
                            Mark en route
                          </Button>
                        </form>
                      ) : null}
                    </div>
                    {assignment.order.status === "EN_ROUTE" ? (
                      <form action={confirmOrderDelivery} className="mt-3 flex flex-wrap gap-2">
                        <input type="hidden" name="orderId" value={assignment.order.id} />
                        <input
                          name="deliveryCode"
                          inputMode="numeric"
                          pattern="[0-9]{4}"
                          maxLength={4}
                          placeholder="4-digit code"
                          className="h-9 w-36 rounded-md border border-border bg-background px-3 text-sm"
                          required
                        />
                        <Button type="submit" size="sm">
                          Confirm delivery
                        </Button>
                      </form>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {historyAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No history entries yet.
                </p>
              ) : (
                historyAssignments.slice(0, 10).map((assignment) => (
                  <div key={assignment.id} className="rounded-lg border border-border/70 p-3">
                    <p className="text-sm font-medium">
                      {assignment.order.restaurant.restaurantName}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Order #{assignment.order.id.slice(0, 8)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {assignment.rejectedAt ? "Rejected" : "Delivered"}
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
