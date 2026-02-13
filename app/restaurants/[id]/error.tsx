"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ErrorPageProps = {
  error: Error;
  reset: () => void;
};

export default function RestaurantErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-16">
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Unable to load restaurant</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Please retry. If the issue continues, return to the restaurants list.
          </p>
          <p className="text-xs text-muted-foreground">{error.message}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={reset}>
              Try again
            </Button>
            <Button asChild variant="outline">
              <Link href="/restaurants">Back to restaurants</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
