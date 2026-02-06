"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  ChefHat,
  ChartLine,
  ClipboardList,
  LayoutDashboard,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { useMarketingAnimations } from "@/components/marketing/use-marketing-animations";

const restaurantHighlights = [
  {
    title: "Low 5% service fee",
    description:
      "Keep more of your revenue with a transparent, flat commission.",
    icon: ChartLine,
  },
  {
    title: "Employee access",
    description:
      "Invite managers, chefs, and cashiers with the right permissions.",
    icon: Users,
  },
  {
    title: "Custom restaurant page",
    description:
      "Showcase your kitchen with branded menus, images, and story blocks.",
    icon: Store,
  },
  {
    title: "Structured menu builder",
    description:
      "Organize categories and sizes so customers order with confidence.",
    icon: ClipboardList,
  },
  {
    title: "Order protection",
    description:
      "Verification codes keep handoffs clear and payouts predictable.",
    icon: ShieldCheck,
  },
  {
    title: "Operational insights",
    description:
      "Track prep times, top sellers, and demand patterns in real time.",
    icon: LayoutDashboard,
  },
];

const onboardingSteps = [
  {
    title: "Create your profile",
    description:
      "Share your restaurant details, operating hours, and kitchen location.",
  },
  {
    title: "Build your menu",
    description:
      "Add categories, portion sizes, and add-ons with structured fields.",
  },
  {
    title: "Go live",
    description:
      "Start receiving orders and keep staff aligned with clear workflows.",
  },
];

export default function RestaurantPage() {
  const rootRef = useRef<HTMLDivElement>(null);

  useMarketingAnimations(rootRef);

  return (
    <div
      ref={rootRef}
      className="relative min-h-screen overflow-hidden bg-background"
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          data-float
          className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[rgba(255,128,79,0.2)] blur-3xl"
        />
        <div
          data-float
          className="absolute right-12 top-52 h-36 w-36 rounded-full bg-[rgba(66,192,164,0.2)] blur-2xl"
        />
        <div
          data-float
          className="absolute left-8 top-32 h-24 w-24 rounded-full bg-[rgba(252,211,77,0.2)] blur-2xl"
        />
      </div>

      <SiteHeader />

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-20 px-6 pb-20 pt-12">
        <section className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div
              data-hero
              className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-1 text-xs uppercase tracking-[0.3em] text-muted-foreground"
            >
              <ChefHat className="size-4 text-primary" />
              Restaurant partners
            </div>
            <h1
              data-hero
              className="font-display text-4xl font-semibold tracking-tight md:text-5xl"
            >
              Turn your kitchen into a delivery storefront with control.
            </h1>
            <p data-hero className="text-base text-muted-foreground">
              Foodify connects you to nearby customers, helps you structure your
              menu, and keeps payouts predictable with a flat 5% fee.
            </p>
            <div data-hero className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signup?role=Restaurant">Join as a restaurant</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/signup">Create an account</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ChartLine className="size-4 text-primary" />
                5% service fee
              </div>
              <div className="flex items-center gap-2">
                <Users className="size-4 text-primary" />
                Team access
              </div>
              <div className="flex items-center gap-2">
                <ClipboardList className="size-4 text-primary" />
                Structured menus
              </div>
            </div>
          </div>
          <div data-hero className="relative">
            <div className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-primary/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-[rgba(252,211,77,0.8)]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[rgba(66,192,164,0.8)]" />
                <span className="ml-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Menu builder
                </span>
              </div>
              <div className="mt-6 grid gap-4">
                <div className="rounded-2xl border border-border/70 bg-background p-4">
                  <p className="text-sm font-semibold">Menu categories</p>
                  <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                    {[
                      "Rice dishes",
                      "Swallow & soups",
                      "Grills",
                      "Drinks",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 px-4 py-2"
                      >
                        <span>{item}</span>
                        <span>4 items</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background p-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Today</span>
                    <span>18 orders</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold">
                    Average prep time: 21 mins
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Most popular: Party Jollof + Grilled Chicken
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6" data-reveal="up">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Built for restaurants
            </p>
            <h2 className="font-display text-3xl font-semibold">
              Everything you need to manage demand.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {restaurantHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border/70 bg-card/70 p-5"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <div className="space-y-2">
                      <p className="text-base font-semibold">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]" data-reveal="up">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Quick onboarding
            </p>
            <h3 className="font-display text-2xl font-semibold">
              Go live with a clear, structured setup.
            </h3>
            <p className="text-sm text-muted-foreground">
              From menus to staff access, Foodify keeps onboarding predictable so
              you can serve customers faster.
            </p>
            <div className="space-y-3">
              {onboardingSteps.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-xl border border-border/60 bg-muted/40 px-4 py-3"
                >
                  <p className="text-sm font-semibold">
                    {String(index + 1).padStart(2, "0")} {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-border/70 bg-card/80 p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Restaurant page preview</p>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                Verified
              </span>
            </div>
            <div className="mt-4 rounded-2xl border border-border/60 bg-background p-5">
              <p className="text-base font-semibold">Island Smokehouse</p>
              <p className="text-xs text-muted-foreground">
                Grills - Seafood - Lagos Island
              </p>
              <div className="mt-4 grid gap-3">
                {[
                  "Mixed grill platter",
                  "Seafood okra soup",
                  "Pepper chicken wrap",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-xs"
                  >
                    <span>{item}</span>
                    <span className="text-muted-foreground">From N3,500</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Your menu is organized for fast ordering and fewer mistakes.
            </p>
          </div>
        </section>

        <section
          data-reveal="up"
          className="rounded-3xl border border-border/70 bg-muted/40 px-6 py-10 text-center"
        >
          <h3 className="font-display text-2xl font-semibold">
            Ready to serve more customers?
          </h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
            Join Foodify and keep every order, team member, and payout organized
            in one place.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup?role=Restaurant">Apply as a restaurant</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
