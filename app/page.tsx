"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  Bike,
  MapPin,
  ShieldCheck,
  Sparkles,
  Store,
  UtensilsCrossed,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { useMarketingAnimations } from "@/components/marketing/use-marketing-animations";

const roleCards = [
  {
    title: "Customers",
    description:
      "Order in minutes, track your rider, or switch to pickup when you prefer.",
    icon: UtensilsCrossed,
    href: "/customer",
  },
  {
    title: "Restaurants",
    description:
      "Serve more customers with structured menus and a low 5% fee.",
    icon: Store,
    href: "/for-restaurants",
  },
  {
    title: "Riders",
    description:
      "Ride with smart routing, instant payout, and a personalized dashboard.",
    icon: Bike,
    href: "/riders",
  },
];

const workSteps = [
  {
    title: "Curate the best kitchens",
    description:
      "We verify restaurants so customers see only trusted options.",
  },
  {
    title: "Take simple, clear orders",
    description:
      "Structured menus mean fewer mistakes and faster prep.",
  },
  {
    title: "Dispatch and track riders",
    description:
      "Customers watch deliveries in real time with clear ETAs.",
  },
  {
    title: "Confirm and pay out",
    description:
      "Delivery codes keep payouts secure for restaurants and riders.",
  },
];

const connectionHighlights = [
  {
    title: "Customers",
    description: "Know the wait time before you hit pay.",
  },
  {
    title: "Restaurants",
    description: "Stay organized with categories and portion sizes.",
  },
  {
    title: "Riders",
    description: "Follow smart routes with clear drop-off info.",
  },
];

const easeSteps = [
  {
    title: "Tap to order",
    description:
      "Every menu item is structured so checkout is fast and accurate.",
  },
  {
    title: "See every update",
    description:
      "Get prep and rider status changes right on your screen.",
  },
  {
    title: "Confirm delivery",
    description:
      "Use a secure code so every order is closed properly.",
  },
];

const marqueeItems = [
  "Mainland Buka",
  "Island Grill",
  "Fusion Kitchen",
  "Shawarma Yard",
  "Green Bowl",
  "Oven House",
  "Street Suya",
  "Lagos Bistro",
  "Seafood Spot",
  "Midnight Pizza",
];

export default function Home() {
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
          className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[rgba(255,128,79,0.18)] blur-3xl"
        />
        <div
          data-float
          className="absolute left-8 top-56 h-32 w-32 rounded-full bg-[rgba(66,192,164,0.2)] blur-2xl"
        />
        <div
          data-float
          className="absolute right-10 top-36 h-24 w-24 rounded-full bg-[rgba(252,211,77,0.2)] blur-2xl"
        />
      </div>

      <SiteHeader />

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-24 px-6 pb-20 pt-12">
        <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div
              data-hero
              className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-1 text-xs uppercase tracking-[0.3em] text-muted-foreground"
            >
              <Sparkles className="size-4 text-primary" />
              Built for Lagos
            </div>
            <h1
              data-hero
              className="font-display text-4xl font-semibold tracking-tight md:text-6xl"
            >
              Foodify brings trusted restaurants, riders, and customers together
              in one flow.
            </h1>
            <p data-hero className="max-w-xl text-base text-muted-foreground">
              Order a meal, pick it up, or have it delivered. Foodify keeps every
              step clear with verified restaurants, live tracking, and secure
              delivery confirmation.
            </p>
            <div data-hero className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signup">
                  Get started
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#roles">See how it works</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                Verified restaurants
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                Live tracking
              </div>
              <div className="flex items-center gap-2">
                <BadgeCheck className="size-4 text-primary" />
                Secure handoff
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
                  Foodify overview
                </span>
              </div>
              <div className="mt-6 grid gap-4">
                <div className="rounded-2xl border border-border/70 bg-background p-4">
                  <p className="text-sm font-semibold">Order timeline</p>
                  <div className="mt-3 grid gap-3">
                    {[
                      "Order placed",
                      "Restaurant accepted",
                      "Rider en route",
                      "Delivery confirmed",
                    ].map((item, index) => (
                      <div
                        key={item}
                        className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 px-4 py-2 text-xs"
                      >
                        <span>{item}</span>
                        <span className="text-muted-foreground">
                          {index < 2 ? "Done" : "Next"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background p-4">
                  <p className="text-sm font-semibold">Today in Foodify</p>
                  <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Active restaurants</span>
                      <span className="text-foreground">128</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Riders on shift</span>
                      <span className="text-foreground">64</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Avg delivery time</span>
                      <span className="text-foreground">28 mins</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="roles" className="grid gap-6" data-reveal="up">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              General use
            </p>
            <h2 className="font-display text-3xl font-semibold">
              One platform, three clear experiences.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {roleCards.map((role) => {
              const Icon = role.icon;
              return (
                <div
                  key={role.title}
                  className="flex h-full flex-col justify-between rounded-2xl border border-border/70 bg-card/70 p-5"
                >
                  <div className="space-y-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <p className="text-base font-semibold">{role.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {role.description}
                      </p>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline" className="mt-4">
                    <Link href={role.href}>Learn more</Link>
                  </Button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]" data-reveal="up">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              What we do
            </p>
            <h2 className="font-display text-3xl font-semibold">
              Foodify keeps the journey disciplined and simple.
            </h2>
            <p className="text-sm text-muted-foreground">
              We connect customers to the finest restaurants, sync riders with
              smart routing, and protect every handoff with secure confirmation.
            </p>
            <div className="space-y-3">
              {workSteps.map((step, index) => (
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
            <p className="text-sm font-semibold">Connection map</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Customers, kitchens, and riders stay synced in one shared timeline.
            </p>
            <div className="mt-6 grid gap-4">
              {connectionHighlights.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border/60 bg-background px-4 py-3"
                >
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-6" data-reveal="up">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Connect everyone
            </p>
            <h2 className="font-display text-3xl font-semibold">
              A shared system that stays in motion.
            </h2>
            <p className="text-sm text-muted-foreground">
              Foodify connects vetted restaurants with hungry customers while
              guiding riders with real-time routing and updates.
            </p>
          </div>
          <div className="overflow-hidden rounded-3xl border border-border/70 bg-card/80 py-6">
            <div
              data-marquee
              data-duration="24"
              className="flex w-max items-center gap-4 px-6"
            >
              {[...marqueeItems, ...marqueeItems].map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="flex items-center gap-2 rounded-full border border-border/60 bg-background px-4 py-2 text-xs font-semibold"
                >
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]" data-reveal="up">
          <div className="rounded-3xl border border-border/70 bg-card/80 p-6">
            <p className="text-sm font-semibold">Easy to use</p>
            <p className="mt-2 text-xs text-muted-foreground">
              The Foodify flow is built for speed, clarity, and reliability.
            </p>
            <div className="mt-4 space-y-3">
              {easeSteps.map((step) => (
                <div
                  key={step.title}
                  className="rounded-xl border border-border/60 bg-background px-4 py-3"
                >
                  <p className="text-sm font-semibold">{step.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Why it feels smooth
            </p>
            <h2 className="font-display text-3xl font-semibold">
              No messy handoffs. No hidden delays. Just clean delivery.
            </h2>
            <p className="text-sm text-muted-foreground">
              Foodify keeps every partner aligned with automated updates, safe
              confirmation, and a structured ordering experience.
            </p>
            <Button asChild size="lg">
              <Link href="/signup">Start using Foodify</Link>
            </Button>
          </div>
        </section>

        <section
          data-reveal="up"
          className="rounded-3xl border border-border/70 bg-muted/40 px-6 py-10 text-center"
        >
          <h2 className="font-display text-2xl font-semibold">
            Ready to join the Foodify flow?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
            Customers, restaurants, and riders all move faster when the workflow
            is clear. Start today and see how simple delivery can feel.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">Start onboarding</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/signup?role=Customer">Explore as customer</Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
