import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getUserFromSession } from "@/app/lib/session";
import { Role } from "@/app/generated/prisma/client";
import { signOut } from "@/app/lib/auth-actions";

function getRoleNav(userRole: Role, userStatus: string) {
  if (userRole === Role.CUSTOMER) {
    return [
      { label: "Dashboard", href: "/customer" },
      { label: "Restaurants", href: "/restaurants" },
      { label: "Orders", href: "/customer/orders" },
      { label: "Profile", href: "/customer/profile" },
    ];
  }

  if (userRole === Role.RESTAURANT) {
    const nav = [
      { label: "Dashboard", href: "/restaurant" },
      { label: "Menu", href: "/restaurant/menu" },
      { label: "Orders", href: "/restaurant/orders" },
      { label: "Staff", href: "/restaurant/staff" },
      { label: "Settings", href: "/restaurant/settings" },
    ];

    if (userStatus === "EMAIL_VERIFIED" || userStatus === "REJECTED") {
      nav.push({ label: "Onboarding", href: "/onboarding/restaurant" });
    }

    return nav;
  }

  if (userRole === Role.DRIVER) {
    return [{ label: "Dashboard", href: "/onboarding/driver" }];
  }

  return [];
}

export async function AppHeader() {
  const user = await getUserFromSession();
  if (!user) {
    return null;
  }

  const navItems = getRoleNav(user.role, user.status);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between gap-4">
          <Link href={navItems[0]?.href ?? "/"} className="font-display text-lg font-semibold">
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
          <form action={signOut} className="md:hidden">
            <Button type="submit" size="sm" variant="outline">
              Log out
            </Button>
          </form>
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {user.role === Role.CUSTOMER ? (
            <Button asChild size="sm">
              <Link href="/customer/cart">Cart</Link>
            </Button>
          ) : user.role === Role.RESTAURANT ? (
            <Button asChild size="sm" variant="outline">
              <Link href="/restaurant">Restaurant dashboard</Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link href={`/onboarding/${user.role.toLowerCase()}`}>
                Go to onboarding
              </Link>
            </Button>
          )}
          <form action={signOut}>
            <Button type="submit" size="sm" variant="outline">
              Log out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
