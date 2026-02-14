import Link from "next/link";

import { AppHeader } from "@/components/app/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RestaurantNotFound() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Restaurant not found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This restaurant is unavailable or no longer listed.
            </p>
            <Button asChild>
              <Link href="/app">Browse restaurants</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

