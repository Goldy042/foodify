import { AppHeader } from "@/components/app/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireDriverAccess } from "@/app/driver/_lib/access";
import prisma from "@/lib/prisma";
import { formatCurrency } from "@/app/lib/pricing";

export default async function DriverPayoutsPage() {
  const { user } = await requireDriverAccess();

  const payouts = await prisma.payoutLedgerEntry.findMany({
    where: {
      recipientType: "DRIVER",
      recipientId: user.id,
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Rider Payouts
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Payout Ledger
          </h1>
          <p className="text-sm text-muted-foreground">
            Track payout entries generated from completed deliveries.
          </p>
        </header>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Recent payouts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {payouts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No payout entries yet. Confirm deliveries to generate payouts.
              </p>
            ) : (
              payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      Order #{payout.orderId.slice(0, 8)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {payout.createdAt.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {payout.status}
                    </p>
                    <p className="text-sm font-semibold">
                      {formatCurrency(Number(payout.amount))}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
