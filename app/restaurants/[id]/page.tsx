import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppHeader } from "@/components/app/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Role } from "@/app/generated/prisma/client";
import {
  areaEnumToLabel,
  cuisineEnumToLabel,
  dayEnumToLabel,
  getApprovedRestaurantById,
  getCustomerProfile,
  measurementEnumToLabel,
  menuCategoryEnumToLabel,
  prepTimeEnumToLabel,
} from "@/app/lib/db";
import { formatCurrency } from "@/app/lib/pricing";
import {
  calculateDistanceKm,
  DEFAULT_SERVICE_RADIUS_KM,
  isRestaurantOpenNow,
} from "@/app/lib/restaurant-availability";
import { getUserFromSession } from "@/app/lib/session";
import { CartStickySummary } from "./cart-sticky-summary";
import { MenuItemActions } from "./menu-item-actions";

type PageProps = {
  params: Promise<{ id: string }> | { id: string };
};

function formatCuisineList(cuisineTypes: readonly string[]) {
  if (cuisineTypes.length === 0) {
    return "Cuisine info unavailable";
  }
  const labels = cuisineTypes.map(
    (cuisine) =>
      cuisineEnumToLabel[cuisine as keyof typeof cuisineEnumToLabel] ?? cuisine
  );
  return labels.join(" | ");
}

export default async function RestaurantDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const user = await getUserFromSession();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== Role.CUSTOMER) {
    redirect(`/onboarding/${user.role.toLowerCase()}`);
  }
  if (user.status === "EMAIL_UNVERIFIED") {
    redirect(`/signup/verify?email=${encodeURIComponent(user.email)}`);
  }
  if (user.status !== "PROFILE_COMPLETED") {
    redirect("/onboarding/customer");
  }

  const profile = await getCustomerProfile(user.id);
  if (!profile) {
    redirect("/onboarding/customer");
  }

  const restaurant = await getApprovedRestaurantById(resolvedParams.id);
  if (!restaurant) {
    notFound();
  }

  const distanceKm = calculateDistanceKm(
    { lat: profile.defaultAddressLat, lng: profile.defaultAddressLng },
    { lat: restaurant.addressLat, lng: restaurant.addressLng }
  );
  if (distanceKm === null || distanceKm > DEFAULT_SERVICE_RADIUS_KM) {
    notFound();
  }

  const restaurantIsOpen = isRestaurantOpenNow({
    daysOpen: restaurant.daysOpen,
    openTime: restaurant.openTime,
    closeTime: restaurant.closeTime,
  });
  const openStatus = {
    isOpen: restaurantIsOpen,
    label: restaurantIsOpen ? "Open now" : "Closed now",
  };

  const daysOpen = restaurant.daysOpen.map((day) => dayEnumToLabel[day]).join(", ");
  const allItems = restaurant.menuCategories.flatMap((category) => category.items);
  const hasAnyItems = allItems.length > 0;
  const availableWhenOpenCount = allItems.filter(
    (item) => item.isAvailable && item.measurements.length > 0
  ).length;

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16">
        <header className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-2xl border border-border/70 bg-muted/40">
                {restaurant.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={restaurant.logoUrl}
                    alt={`${restaurant.restaurantName} logo`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-base font-semibold text-muted-foreground">
                    {restaurant.restaurantName.charAt(0)}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                  Restaurant menu
                </p>
                <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                  {restaurant.restaurantName}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {areaEnumToLabel[restaurant.area]} |{" "}
                  {formatCuisineList(restaurant.cuisineTypes)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {restaurant.streetAddress}, {restaurant.city}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/restaurants">Back to restaurants</Link>
              </Button>
              <Button asChild>
                <Link href="/customer/cart">View cart</Link>
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span
              className={`rounded-full border px-3 py-1 font-semibold ${
                openStatus.isOpen
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-border/70 bg-muted/40 text-muted-foreground"
              }`}
            >
              {openStatus.label}
            </span>
            <span className="rounded-full border border-border/70 px-3 py-1">
              Prep {prepTimeEnumToLabel[restaurant.prepTimeRange]}
            </span>
            <span className="rounded-full border border-border/70 px-3 py-1">
              {restaurant.openTime} - {restaurant.closeTime}
            </span>
            <span className="rounded-full border border-border/70 px-3 py-1">
              {daysOpen}
            </span>
            {distanceKm !== null ? (
              <span className="rounded-full border border-border/70 px-3 py-1">
                {distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km from you
              </span>
            ) : null}
            <span className="rounded-full border border-border/70 px-3 py-1">
              {availableWhenOpenCount} orderable item
              {availableWhenOpenCount === 1 ? "" : "s"}
            </span>
          </div>
        </header>

        {!restaurantIsOpen ? (
          <Card className="border-border/70 shadow-sm">
            <CardContent className="space-y-2 py-4">
              <p className="text-sm font-medium">This restaurant is currently closed.</p>
              <p className="text-sm text-muted-foreground">
                You can browse the menu now, but ordering is available only during
                open hours.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {restaurant.menuCategories.length > 0 ? (
          <Card className="border-border/70 shadow-sm">
            <CardContent className="flex flex-wrap gap-2 py-4">
              {restaurant.menuCategories.map((category) => (
                <Button key={category.id} asChild size="sm" variant="outline">
                  <Link href={`#category-${category.id}`}>
                    {menuCategoryEnumToLabel[category.category]}
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {!hasAnyItems ? (
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Menu coming soon</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                This restaurant has not published any menu items yet.
              </p>
              <Button asChild variant="outline">
                <Link href="/restaurants">Browse other restaurants</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {restaurantIsOpen && availableWhenOpenCount === 0 ? (
              <Card className="border-border/70 shadow-sm">
                <CardContent className="space-y-3 py-4">
                  <p className="text-sm font-medium">No items available right now</p>
                  <p className="text-sm text-muted-foreground">
                    This menu is published, but current items cannot be ordered yet.
                  </p>
                </CardContent>
              </Card>
            ) : null}

            {restaurant.menuCategories.map((category) => (
              <section
                key={category.id}
                id={`category-${category.id}`}
                className="space-y-4 scroll-mt-28"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold">
                    {menuCategoryEnumToLabel[category.category]}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {category.items.length} item
                    {category.items.length === 1 ? "" : "s"}
                  </span>
                </div>
                {category.items.length === 0 ? (
                  <Card className="border-border/70 shadow-sm">
                    <CardContent className="py-4 text-sm text-muted-foreground">
                      No items yet in this category.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2">
                    {category.items.map((item) => {
                      const disabledReason =
                        !restaurantIsOpen
                          ? "closed"
                          : !item.isAvailable
                            ? "unavailable"
                            : null;
                      const isDisabled = Boolean(disabledReason);
                      return (
                        <Card key={item.id} className="border-border/70 shadow-sm">
                          <CardHeader className="space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <CardTitle className="text-lg">{item.name}</CardTitle>
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[10px] uppercase ${
                                  disabledReason === "closed"
                                    ? "border-border/70 bg-muted/40 text-muted-foreground"
                                    : disabledReason === "unavailable"
                                      ? "border-border/70 bg-muted/40 text-muted-foreground"
                                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                                }`}
                              >
                                {disabledReason === "closed"
                                  ? "Closed"
                                  : disabledReason === "unavailable"
                                    ? "Unavailable"
                                    : "Available"}
                              </span>
                            </div>
                            {item.description ? (
                              <p className="text-sm text-muted-foreground">
                                {item.description}
                              </p>
                            ) : null}
                          </CardHeader>
                          <CardContent className="space-y-4 text-sm">
                            <div className="space-y-2">
                              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                                Measurements
                              </p>
                              {item.measurements.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                  No measurement options configured yet.
                                </p>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  {item.measurements.map((measurement) => (
                                    <span
                                      key={measurement.id}
                                      className="rounded-full border border-border/70 px-3 py-1 text-xs"
                                    >
                                      {measurementEnumToLabel[measurement.unit]} |{" "}
                                      {formatCurrency(Number(measurement.basePrice))}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            {item.measurements.length > 0 ? (
                              <MenuItemActions
                                restaurant={{
                                  id: restaurant.id,
                                  name: restaurant.restaurantName,
                                }}
                                item={{ id: item.id, name: item.name }}
                                measurements={item.measurements.map((measurement) => ({
                                  id: measurement.id,
                                  unit: measurement.unit,
                                  basePrice: Number(measurement.basePrice),
                                }))}
                                modifierGroups={item.modifierGroups.map((group) => ({
                                  id: group.id,
                                  name: group.name,
                                  isRequired: group.isRequired,
                                  maxSelections: group.maxSelections,
                                  options: group.options.map((option) => ({
                                    id: option.id,
                                    name: option.name,
                                    priceDelta: Number(option.priceDelta),
                                    maxQuantity: option.maxQuantity,
                                    includedQuantity: option.includedQuantity,
                                    defaultQuantity: option.defaultQuantity,
                                  })),
                                }))}
                                disabled={isDisabled}
                                disabledReason={disabledReason ?? "unavailable"}
                              />
                            ) : (
                              <Button type="button" variant="outline" disabled>
                                {restaurantIsOpen ? "Unavailable" : "Closed"}
                              </Button>
                            )}
                            {item.modifierGroups.length > 0 ? (
                              <div className="space-y-2">
                                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                                  Modifiers
                                </p>
                                <div className="space-y-3">
                                  {item.modifierGroups.map((group) => (
                                    <div key={group.id} className="space-y-2">
                                      <div className="flex flex-wrap items-center gap-2 text-xs">
                                        <span className="font-semibold">{group.name}</span>
                                        <span className="rounded-full border border-border/70 px-2 py-0.5 text-[10px] uppercase">
                                          {group.isRequired ? "Required" : "Optional"}
                                        </span>
                                        <span className="text-muted-foreground">
                                          Max {group.maxSelections}
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                        {group.options.map((option) => (
                                          <span
                                            key={option.id}
                                            className="rounded-full border border-border/70 px-3 py-1"
                                          >
                                            {option.name} |{" "}
                                            +{formatCurrency(Number(option.priceDelta))}
                                            {option.includedQuantity > 0
                                              ? ` (${option.includedQuantity} included)`
                                              : ""}
                                            {option.defaultQuantity > 0
                                              ? ` (default ${option.defaultQuantity})`
                                              : ""}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </main>
      <CartStickySummary restaurantId={restaurant.id} />
    </div>
  );
}
