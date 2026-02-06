"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  Clock,
  MapPin,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Truck,
  UtensilsCrossed,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { useMarketingAnimations } from "@/components/marketing/use-marketing-animations";

const customerHighlights = [
  {
    title: "Verified restaurants",
    description:
      "We review kitchens and menus so you are choosing from trusted spots.",
    icon: ShieldCheck,
  },
  {
    title: "Real-time wait times",
    description:
      "Know exactly when your meal is ready, whether you pick up or deliver.",
    icon: Clock,
  },
  {
    title: "Live rider tracking",
    description:
      "See your rider move on the map, from restaurant door to your gate.",
    icon: MapPin,
  },
  {
    title: "Pickup flexibility",
    description:
      "Switch to pickup with one tap and avoid delivery fees when you want.",
    icon: UtensilsCrossed,
  },
];

const experienceSteps = [
  {
    title: "Find the right meal",
    description:
      "Browse curated menus with clear portion sizes and pricing upfront.",
  },
  {
    title: "Track your rider",
    description:
      "Watch your delivery move in real time and get arrival pings.",
  },
  {
    title: "Confirm with a code",
    description:
      "A secure delivery code protects your order and keeps handoffs clean.",
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
  "Sunday Rice",
  "Midnight Pizza",
];

export default function CustomerPage() {
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
          className="absolute left-10 top-48 h-36 w-36 rounded-full bg-[rgba(66,192,164,0.2)] blur-2xl"
        />
        <div
          data-float
          className="absolute right-16 top-32 h-24 w-24 rounded-full bg-[rgba(252,211,77,0.2)] blur-2xl"
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
              <Sparkles className="size-4 text-primary" />
              Customer experience
            </div>
            <h1
              data-hero
              className="font-display text-4xl font-semibold tracking-tight md:text-5xl"
            >
              Order from the comfort of your home, with every step in view.
            </h1>
            <p data-hero className="text-base text-muted-foreground">
              Foodify keeps ordering simple: curated restaurants, clear wait
              times, and a delivery code that protects every handoff.
            </p>
            <div data-hero className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signup?role=Customer">Start ordering</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/signup">Create an account</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Smartphone className="size-4 text-primary" />
                App-first ordering
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                Live tracking
              </div>
              <div className="flex items-center gap-2">
                <Truck className="size-4 text-primary" />
                Pickup or delivery
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
                  Foodify web preview
                </span>
              </div>
              <div className="mt-6 grid gap-4">
                <div className="rounded-2xl border border-border/70 bg-background p-4">
                  <p className="text-sm font-semibold">Today&apos;s top picks</p>
                  <p className="text-xs text-muted-foreground">
                    14 trusted restaurants near you
                  </p>
                  <div className="mt-4 grid gap-3">
                    {[
                      "Jollof & Chicken",
                      "Pasta Bowl",
                      "Seafood Platter",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-xs"
                      >
                        <span>{item}</span>
                        <span className="text-muted-foreground">25 mins</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background p-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Order status</span>
                    <span>En route</span>
                  </div>
                  <div className="mt-3 h-2 w-full rounded-full bg-muted">
                    <div className="h-full w-2/3 rounded-full bg-primary" />
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Rider is 8 minutes away. Keep your phone close.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6" data-reveal="up">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Why customers choose Foodify
            </p>
            <h2 className="font-display text-3xl font-semibold">
              We make ordering feel effortless.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {customerHighlights.map((item) => {
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
              Always in the know
            </p>
            <h3 className="font-display text-2xl font-semibold">
              Wait times, rider movement, and pickup options are clear.
            </h3>
            <p className="text-sm text-muted-foreground">
              We surface prep time ranges, rider arrival updates, and kitchen
              status so you can plan your day without guessing.
            </p>
            <div className="space-y-3">
              {experienceSteps.map((step) => (
                <div
                  key={step.title}
                  className="rounded-xl border border-border/60 bg-muted/40 px-4 py-3"
                >
                  <p className="text-sm font-semibold">{step.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-border/70 bg-card/80 p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Live tracking</p>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                Rider 2.3 km away
              </span>
            </div>
            <div className="mt-4 rounded-2xl border border-border/60 bg-[radial-gradient(circle_at_top,_rgba(66,192,164,0.15),_rgba(255,255,255,0.9))] p-6">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Ikoyi to Lekki</span>
                <span>ETA 12 mins</span>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <MapPin className="size-5" />
                </span>
                <div className="h-1 w-2/3 rounded-full bg-muted">
                  <div className="h-full w-3/4 rounded-full bg-primary" />
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/40 text-accent-foreground">
                  <Truck className="size-5" />
                </span>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Customers see every update from prep to doorstep.
            </p>
          </div>
        </section>

        <section className="space-y-6" data-reveal="up">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Popular kitchens on Foodify
            </p>
            <h3 className="font-display text-2xl font-semibold">
              Discover new favorites, from street classics to fine dining.
            </h3>
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

        <section
          data-reveal="up"
          className="rounded-3xl border border-border/70 bg-muted/40 px-6 py-10 text-center"
        >
          <h3 className="font-display text-2xl font-semibold">
            Ready to order without the stress?
          </h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
            Foodify keeps ordering simple and transparent. From trusted
            restaurants to reliable delivery, everything is built to feel
            effortless.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup?role=Customer">Join as a customer</Link>
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
