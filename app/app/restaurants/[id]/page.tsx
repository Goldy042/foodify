import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppHeader } from "@/components/app/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Role } from "@/app/generated/prisma/client";
import {
  areaEnumToLabel,
  cuisineEnumToLabel,
  dayEnumToLabel,
  getApprovedRestaurantById,
  getCustomerProfile,
  menuCategoryEnumToLabel,
  prepTimeEnumToLabel,
} from "@/app/lib/db";
import { formatCurrency } from "@/app/lib/pricing";
import {
  calculateDistanceKm,
  isRestaurantOpenNow,
} from "@/app/lib/restaurant-availability";
import { getUserFromSession } from "@/app/lib/session";
import { CartStickySummary } from "@/app/restaurants/[id]/cart-sticky-summary";
import { MenuItemActions } from "@/app/restaurants/[id]/menu-item-actions";

type PageProps = {
  params: Promise<{ id: string }> | { id: string };
  searchParams?: Promise<{ tab?: string | string[] }> | { tab?: string | string[] };
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

function getStartingPrice(
  measurements: Array<{ basePrice: number | string | bigint }>
) {
  if (measurements.length === 0) {
    return null;
  }

  const min = Math.min(...measurements.map((measurement) => Number(measurement.basePrice)));
  return Number.isFinite(min) ? min : null;
}

function getFirstValue(input?: string | string[]) {
  if (!input) {
    return "";
  }
  return Array.isArray(input) ? input[0] ?? "" : input;
}

export default async function RestaurantDetailPage({
  params,
  searchParams,
}: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = (await searchParams) ?? {};

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

  if (distanceKm === null) {
    notFound();
  }


  const restaurantIsOpen = isRestaurantOpenNow({
    daysOpen: restaurant.daysOpen,
    openTime: restaurant.openTime,
    closeTime: restaurant.closeTime,
  });

  const daysOpen = restaurant.daysOpen.map((day) => dayEnumToLabel[day]).join(", ");
  const categoriesWithItems = restaurant.menuCategories.filter(
    (category) => category.items.length > 0
  );
  const allItems = categoriesWithItems.flatMap((category) => category.items);
  const availableWhenOpenCount = allItems.length;

  const categoryTabs = categoriesWithItems.map((category) => ({
    id: category.id,
    name: menuCategoryEnumToLabel[category.category],
    itemCount: category.items.length,
  }));
  const requestedTab = getFirstValue(resolvedSearchParams.tab);
  const activeTab =
    categoryTabs.find((tab) => tab.id === requestedTab)?.id ?? categoryTabs[0]?.id ?? "";

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-7 px-6 py-10 md:py-12">
        <section className="overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-orange-100 via-amber-50 to-background shadow-sm">
          <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-end md:p-8">
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/app">Back to restaurants</Link>
                </Button>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    restaurantIsOpen
                      ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                      : "border-border/80 bg-background/80 text-muted-foreground"
                  }`}
                >
                  {restaurantIsOpen ? "Open now" : "Closed now"}
                </span>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-2xl border border-border/70 bg-background/70 md:h-20 md:w-20">
                  {restaurant.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={restaurant.logoUrl}
                      alt={`${restaurant.restaurantName} logo`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-muted-foreground">
                      {restaurant.restaurantName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">
                    Restaurant storefront
                  </p>
                  <h1 className="font-display text-3xl font-semibold tracking-tight md:text-5xl">
                    {restaurant.restaurantName}
                  </h1>
                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
                    {areaEnumToLabel[restaurant.area]} | {formatCuisineList(restaurant.cuisineTypes)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 md:justify-end">
              <Button asChild>
                <Link href="/app/cart">View cart</Link>
              </Button>
              <Button variant="outline" disabled>
                Checkout coming soon
              </Button>
            </div>
          </div>

          <div className="grid gap-2 border-t border-border/60 bg-background/55 px-6 py-4 text-xs text-muted-foreground md:grid-cols-5 md:px-8">
            <div className="rounded-lg border border-border/60 bg-background/70 px-3 py-2">
              Prep: {prepTimeEnumToLabel[restaurant.prepTimeRange]}
            </div>
            <div className="rounded-lg border border-border/60 bg-background/70 px-3 py-2">
              Hours: {restaurant.openTime} - {restaurant.closeTime}
            </div>
            <div className="rounded-lg border border-border/60 bg-background/70 px-3 py-2">
              Days: {daysOpen}
            </div>
            <div className="rounded-lg border border-border/60 bg-background/70 px-3 py-2">
              {distanceKm < 10 ? distanceKm.toFixed(1) : distanceKm.toFixed(0)} km from you
            </div>
            <div className="rounded-lg border border-border/60 bg-background/70 px-3 py-2">
              {availableWhenOpenCount} orderable item
              {availableWhenOpenCount === 1 ? "" : "s"}
            </div>
          </div>
        </section>

        {categoriesWithItems.length === 0 ? (
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Menu coming soon</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                This restaurant has not published any menu items yet.
              </p>
              <Button asChild variant="outline">
                <Link href="/app">Browse other restaurants</Link>
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

            <Tabs defaultValue={activeTab} className="gap-5">
              <TabsList className="h-auto w-full justify-start gap-2 overflow-x-auto rounded-xl border border-border/70 bg-background p-2">
                {categoryTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="h-auto min-w-fit rounded-lg border border-transparent px-4 py-2 data-[state=active]:border-border/70"
                  >
                    <span>{tab.name}</span>
                    <span className="text-xs text-muted-foreground">{tab.itemCount}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {categoriesWithItems.map((category) => (
                <TabsContent key={category.id} value={category.id} className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-2xl font-semibold tracking-tight">
                      {menuCategoryEnumToLabel[category.category]}
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      {category.items.length} item
                      {category.items.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {category.items.length === 0 ? (
                    <Card className="border-border/60 bg-card/80 shadow-sm">
                      <CardContent className="py-4 text-sm text-muted-foreground">
                        No items yet in this category.
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-5 md:grid-cols-2">
                      {category.items.map((item) => {
                        const fromPrice = getStartingPrice(
                          item.measurements.map((m) => ({ basePrice: Number(m.basePrice) }))
                        );
                        const imageUrl = item.baseImageUrl?.trim();

                        return (
                          <Card
                            key={item.id}
                            className="gap-0 overflow-hidden border-border/70 py-0 shadow-sm"
                          >
                            <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-border/60 bg-muted/30">
                              {imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={imageUrl}
                                  alt={`${item.name} photo`}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-100 via-amber-50 to-background px-4 text-center">
                                  <div className="space-y-1">
                                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                      Food image
                                    </p>
                                    <p className="text-sm font-medium text-foreground/80">
                                      {item.name}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>

                            <CardHeader className="space-y-3 border-b border-border/60 pb-4 pt-5">
                              <div className="flex items-start justify-between gap-3">
                                <CardTitle className="text-xl leading-tight">{item.name}</CardTitle>
                                <div className="text-right">
                                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                    From
                                  </p>
                                  <p className="text-base font-semibold">
                                    {fromPrice === null ? "N/A" : formatCurrency(fromPrice)}
                                  </p>
                                </div>
                              </div>
                              {item.description ? (
                                <p className="text-sm leading-6 text-muted-foreground">
                                  {item.description}
                                </p>
                              ) : null}
                            </CardHeader>

                            <CardContent className="space-y-4 pb-5 text-sm">
                              <div className="flex flex-wrap gap-2 text-xs">
                                <span
                                  className={`rounded-full border px-3 py-1 ${
                                    item.isAvailable
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                      : "border-border/70 bg-muted/40 text-muted-foreground"
                                  }`}
                                >
                                  {item.isAvailable ? "Available" : "Unavailable"}
                                </span>
                                <span className="rounded-full border border-border/70 px-3 py-1 text-muted-foreground">
                                  {item.measurements.length} size option
                                  {item.measurements.length === 1 ? "" : "s"}
                                </span>
                                {item.modifierGroups.length > 0 ? (
                                  <span className="rounded-full border border-border/70 px-3 py-1 text-muted-foreground">
                                    {item.modifierGroups.length} add-on group
                                    {item.modifierGroups.length === 1 ? "" : "s"}
                                  </span>
                                ) : null}
                              </div>

                              {item.measurements.length > 0 && item.isAvailable ? (
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
                                  disabled={!restaurantIsOpen || !item.isAvailable}
                                  disabledReason={!restaurantIsOpen ? "closed" : "unavailable"}
                                />
                              ) : item.measurements.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                  This item has no size configuration yet.
                                </p>
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  This item is currently unavailable.
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
      </main>
      <CartStickySummary restaurantId={restaurant.id} />
    </div>
  );
}

