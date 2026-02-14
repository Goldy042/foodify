"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Customers", href: "/app" },
  { label: "Restaurants", href: "/for-restaurants" },
  { label: "Riders", href: "/riders" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="font-display text-lg font-semibold">
            Foodify
          </Link>
          <div className="flex items-center gap-2 md:hidden">
            <Button asChild size="sm" variant="ghost">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">
                Get started
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground md:gap-6 md:text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Button asChild size="sm" variant="ghost">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">
              Get started
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

