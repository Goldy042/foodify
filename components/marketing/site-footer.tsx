"use client";

import Link from "next/link";

const footerLinks = [
  { label: "Customers", href: "/customer" },
  { label: "Restaurants", href: "/resturants" },
  { label: "Riders", href: "/riders" },
  { label: "Sign up", href: "/signup" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
        <div className="grid gap-6 md:grid-cols-[1.3fr_0.7fr_0.7fr]">
          <div className="space-y-3">
            <p className="font-display text-xl font-semibold">Foodify</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              A delivery platform that keeps customers, restaurants, and riders
              in sync, from order to payout.
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Explore
            </p>
            <div className="flex flex-col gap-2">
              {footerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground transition hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Support
            </p>
            <div className="flex flex-col gap-2 text-muted-foreground">
              <span>hello@foodify.africa</span>
              <span>+234 (0) 901 000 0000</span>
              <span>Lagos, NG</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-border/60 pt-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span>(c) 2025 Foodify. All rights reserved.</span>
          <div className="flex gap-4">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Cookies</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
