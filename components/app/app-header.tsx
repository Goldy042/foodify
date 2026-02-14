import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getUserFromSession } from "@/app/lib/session";
import { RestaurantStaffRole, Role } from "@/app/generated/prisma/client";
import { signOut } from "@/app/lib/auth-actions";
import prisma from "@/lib/prisma";

type NavItem = { label: string; href: string };

function getRoleNav(userRole: Role, userStatus: string): NavItem[] {
  if (userRole === Role.CUSTOMER) {
    return [
      { label: "Marketplace", href: "/app" },
      { label: "Orders", href: "/app/orders" },
      { label: "Profile", href: "/app/profile" },
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

function getStaffNav(staffRole: RestaurantStaffRole): NavItem[] {
  const nav: NavItem[] = [
    { label: "Dashboard", href: "/restaurant" },
    { label: "Orders", href: "/restaurant/orders" },
  ];

  if (staffRole === "MANAGER" || staffRole === "SUPERVISOR") {
    nav.push({ label: "Menu", href: "/restaurant/menu" });
  }

  if (staffRole === "MANAGER") {
    nav.push({ label: "Staff", href: "/restaurant/staff" });
    nav.push({ label: "Settings", href: "/restaurant/settings" });
  }

  return nav;
}

export async function AppHeader() {
  const user = await getUserFromSession();
  if (!user) {
    return null;
  }

  const [ownedRestaurant, activeStaffMembership] = await Promise.all([
    prisma.restaurantProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    }),
    prisma.restaurantStaffMember.findFirst({
      where: {
        userId: user.id,
        status: "ACTIVE",
      },
      select: { role: true, status: true },
    }),
  ]);

  const isRestaurantOwner = Boolean(ownedRestaurant);
  const isActiveStaff = Boolean(activeStaffMembership);

  const navItems = isRestaurantOwner
    ? getRoleNav(Role.RESTAURANT, user.status)
    : activeStaffMembership
      ? getStaffNav(activeStaffMembership.role)
      : getRoleNav(user.role, user.status);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between gap-4">
          <Link href={navItems[0]?.href ?? "/"} className="font-display text-lg font-semibold">
            Foodify
          </Link>
          {user.role === Role.CUSTOMER && !isActiveStaff ? (
            <Button asChild size="sm" className="md:hidden">
              <Link href="/app/cart">Cart</Link>
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
          {user.role === Role.CUSTOMER && !isActiveStaff ? (
            <Button asChild size="sm">
              <Link href="/app/cart">Cart</Link>
            </Button>
          ) : isRestaurantOwner || isActiveStaff ? (
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

