import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getUserFromSession } from "@/app/lib/session";
import { Role } from "@/app/generated/prisma/client";

const roleNav: Record<Role, Array<{ label: string; href: string }>> = {
  CUSTOMER: [
    { label: "Dashboard", href: "/customer" },
    { label: "Orders", href: "/customer/orders" },
    { label: "Profile", href: "/customer/profile" },
  ],
  RESTAURANT: [{ label: "Onboarding", href: "/onboarding/restaurant" }],
  DRIVER: [{ label: "Onboarding", href: "/onboarding/driver" }],
  ADMIN: [],
};

export async function AppHeader() {
  const user = await getUserFromSession();
  if (!user) {
    return null;
  }

  const navItems = roleNav[user.role] ?? [];

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="font-display text-lg font-semibold">
            Foodify
          </Link>
          {user.role === Role.CUSTOMER ? (
            <Button asChild size="sm" className="md:hidden">
              <Link href="/customer/cart">Cart</Link>
            </Button>
          ) : null}
        </div>
        <nav className="flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground md:gap-6 md:text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {user.role === Role.CUSTOMER ? (
            <Button asChild size="sm">
              <Link href="/customer/cart">Cart</Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link href={`/onboarding/${user.role.toLowerCase()}`}>
                Go to onboarding
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
