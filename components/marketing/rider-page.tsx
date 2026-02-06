"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  BadgeCheck,
  Banknote,
  Bike,
  MapPin,
  Navigation,
  Radar,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { useMarketingAnimations } from "@/components/marketing/use-marketing-animations";

const riderHighlights = [
  {
    title: "Smart routing",
    description:
      "We calculate your route from restaurant to customer so pickups stay quick.",
    icon: Navigation,
  },
  {
    title: "Live map tracking",
    description:
      "Customers see your real-time movement and arrival estimates.",
    icon: MapPin,
  },
  {
    title: "Instant payout",
    description:
      "Get paid immediately after delivery confirmation. No 24-hour delays.",
    icon: Banknote,
  },
  {
    title: "Easy verification",
    description:
      "Confirm deliveries with a secure code and finish the job faster.",
    icon: ShieldCheck,
  },
  {
    title: "Personalized dashboard",
    description:
      "Track rides, earnings, and peak zones from one personalized hub.",
    icon: Radar,
  },
  {
    title: "Rider status perks",
    description:
      "Build a record of successful deliveries and earn priority dispatch.",
    icon: BadgeCheck,
  },
];

const hotspotAreas = [
  "Victoria Island",
  "Lekki Phase 1",
  "Surulere",
  "Yaba",
  "Ikeja",
  "Ajah",
  "Ikoyi",
  "Oniru",
  "Maryland",
  "Gbagada",
];

export default function RiderPage() {
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
          className="absolute right-8 top-56 h-36 w-36 rounded-full bg-[rgba(66,192,164,0.2)] blur-2xl"
        />
        <div
          data-float
          className="absolute left-8 top-28 h-24 w-24 rounded-full bg-[rgba(252,211,77,0.2)] blur-2xl"
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
              <Bike className="size-4 text-primary" />
              Rider network
            </div>
            <h1
              data-hero
              className="font-display text-4xl font-semibold tracking-tight md:text-5xl"
            >
              Deliver smarter, earn faster, and see your next job early.
            </h1>
            <p data-hero className="text-base text-muted-foreground">
              Foodify calculates your route, updates customers in real time, and
              pays you out immediately after confirmation.
            </p>
            <div data-hero className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signup?role=Driver">Join as a rider</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/signup">Create an account</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Banknote className="size-4 text-primary" />
                Instant payouts
              </div>
              <div className="flex items-center gap-2">
                <Navigation className="size-4 text-primary" />
                Smart routes
              </div>
              <div className="flex items-center gap-2">
                <Radar className="size-4 text-primary" />
                Hot zones
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
                  Rider dashboard
                </span>
              </div>
              <div className="mt-6 grid gap-4">
                <div className="rounded-2xl border border-border/70 bg-background p-4">
                  <p className="text-sm font-semibold">Today&apos;s summary</p>
                  <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 px-4 py-2">
                      <span>Completed rides</span>
                      <span className="text-foreground">12</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 px-4 py-2">
                      <span>Total earnings</span>
                      <span className="text-foreground">N18,400</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 px-4 py-2">
                      <span>Hot zone</span>
                      <span className="text-foreground">Lekki</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background p-4">
                  <p className="text-xs text-muted-foreground">Next pickup</p>
                  <p className="mt-2 text-sm font-semibold">
                    Island Grill to Admiralty Way
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Pickup in 6 mins. Customer sees live ETA.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6" data-reveal="up">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Built for riders
            </p>
            <h2 className="font-display text-3xl font-semibold">
              Tools that keep you moving.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {riderHighlights.map((item) => {
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
              Hot zones
            </p>
            <h3 className="font-display text-2xl font-semibold">
              Know where orders are most likely to drop.
            </h3>
            <p className="text-sm text-muted-foreground">
              Your dashboard highlights busy areas so you can position yourself
              for faster pickups and more earnings.
            </p>
            <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
              <p className="text-sm font-semibold">Live map insight</p>
              <p className="mt-2 text-xs text-muted-foreground">
                The system updates hot zones every 15 minutes based on demand.
              </p>
              <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                High demand zones
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl border border-border/70 bg-card/80 py-6">
            <div
              data-marquee
              data-direction="right"
              data-duration="22"
              className="flex w-max items-center gap-4 px-6"
            >
              {[...hotspotAreas, ...hotspotAreas].map((item, index) => (
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
            Ready to ride with Foodify?
          </h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
            Build your delivery streak, get instant payouts, and ride with clear
            route guidance.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup?role=Driver">Apply as a rider</Link>
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
