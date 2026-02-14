import Link from "next/link";

import { AppHeader } from "@/components/app/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRestaurantUser } from "@/app/restaurant/_lib/guards";

export default async function RestaurantWorkspaceLegacyPage() {
  await requireRestaurantUser();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Legacy Workspace
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Restaurant Tools Have Moved
          </h1>
          <p className="text-sm text-muted-foreground">
            Use the dedicated section pages for cleaner operations and faster daily workflows.
          </p>
        </header>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Open Dedicated Pages</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <Button asChild variant="outline" className="justify-start">
              <Link href="/restaurant">Dashboard</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/restaurant/menu">Menu manager</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/restaurant/orders">Orders hub</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/restaurant/staff">Staff workspace</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/restaurant/settings">Restaurant settings</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

