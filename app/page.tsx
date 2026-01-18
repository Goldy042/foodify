import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { signupRoleOptions } from "@/app/lib/constants";

const highlights = [
  {
    title: "Clear operating rules",
    description:
      "Fixed fields and workflows keep every partner aligned from day one.",
  },
  {
    title: "Verified partner network",
    description:
      "Restaurants and drivers complete a quality review before going live.",
  },
  {
    title: "Escrow-safe payouts",
    description:
      "Delivery confirmation gates payouts and reduces disputes.",
  },
];

const trustSignals = [
  {
    title: "Closed-ended onboarding",
    description: "No ambiguous data. No free-text guessing.",
  },
  {
    title: "Operational visibility",
    description: "Status changes are tracked from order to payout.",
  },
  {
    title: "Reliable delivery proof",
    description: "4-digit code confirms completion before release.",
  },
];

const roleContent = {
  Customer: {
    title: "Order with confidence",
    description:
      "Discover vetted restaurants, track your delivery, and confirm completion with a secure code.",
    cta: "Sign up as a customer",
  },
  Restaurant: {
    title: "Grow your kitchen",
    description:
      "List structured menus, manage demand, and receive payouts after delivery confirmation.",
    cta: "Sign up as a restaurant",
  },
  Driver: {
    title: "Deliver and earn",
    description:
      "Take deliveries in your service areas and receive payouts after each confirmation.",
    cta: "Sign up as a driver",
  },
};

const metrics = [
  { value: "3", label: "Public roles" },
  { value: "100%", label: "Structured fields" },
  { value: "0", label: "Role switching" },
  { value: "24h", label: "Default payout hold" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-16">
        <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
              Foodify Lagos
            </p>
            <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
              A disciplined food delivery platform built for real operations
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground">
              Foodify keeps onboarding clean, menus structured, and payouts safe.
              Customers, restaurants, and drivers each follow clear workflows
              that remove ambiguity.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signup">Create an account</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/signup?role=Customer">Explore as customer</Link>
              </Button>
            </div>
          </div>
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Why Foodify
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {highlights.map((item) => (
                <div
                  key={item.title}
                  className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3"
                >
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
              Choose your path
            </p>
            <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
              Built for customers, restaurants, and drivers
            </h2>
          </header>
          <Tabs defaultValue="Customer" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              {signupRoleOptions.map((role) => (
                <TabsTrigger key={role} value={role}>
                  {role}
                </TabsTrigger>
              ))}
            </TabsList>
            {signupRoleOptions.map((role) => {
              const content = roleContent[role];
              return (
                <TabsContent key={role} value={role}>
                  <Card className="border-border/70 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold">
                        {content.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
                      <p className="max-w-2xl">{content.description}</p>
                      <Button asChild size="lg">
                        <Link href={`/signup?role=${role}`}>{content.cta}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Built for operational trust
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {trustSignals.map((item) => (
                <div
                  key={item.title}
                  className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3"
                >
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Platform metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-lg border border-border/60 bg-background px-4 py-4 text-center"
                >
                  <p className="text-2xl font-semibold">{metric.value}</p>
                  <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                    {metric.label}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="rounded-3xl border border-border/70 bg-muted/30 px-6 py-10 text-center">
          <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Ready to launch with clean, reliable workflows?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
            Start onboarding with a role-specific flow that keeps data structured
            and partners aligned from day one.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">Start onboarding</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/signup?role=Restaurant">Apply as a restaurant</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
