import { notFound, redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserFromSession } from "@/app/lib/session";
import {
  areaEnumToLabel,
  cuisineEnumToLabel,
  dayEnumToLabel,
  measurementEnumToLabel,
  menuCategoryEnumToLabel,
  prepTimeEnumToLabel,
} from "@/app/lib/db";
import { getApprovedRestaurantById } from "@/app/lib/db";
import { Role } from "@/app/generated/prisma/client";
import { formatCurrency } from "@/app/lib/pricing";
import Link from "next/link";
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
  return labels.join(" • ");
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

  const restaurant = await getApprovedRestaurantById(resolvedParams.id);
  if (!restaurant) {
    notFound();
  }

  const daysOpen = restaurant.daysOpen
    .map((day) => dayEnumToLabel[day])
    .join(", ");

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16">
        <header className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                Restaurant menu
              </p>
              <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                {restaurant.restaurantName}
              </h1>
              <p className="text-sm text-muted-foreground">
                {areaEnumToLabel[restaurant.area]} •{" "}
                {formatCuisineList(restaurant.cuisineTypes)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/customer/cart">View cart</Link>
              </Button>
              <Button variant="outline" disabled>
                Checkout coming soon
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="rounded-full border border-border/70 px-3 py-1">
              Prep {prepTimeEnumToLabel[restaurant.prepTimeRange]}
            </span>
            <span className="rounded-full border border-border/70 px-3 py-1">
              {restaurant.openTime} - {restaurant.closeTime}
            </span>
            <span className="rounded-full border border-border/70 px-3 py-1">
              {daysOpen}
            </span>
          </div>
        </header>

        {restaurant.menuCategories.length === 0 ? (
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Menu coming soon</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This restaurant has not published its menu yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {restaurant.menuCategories.map((category) => (
              <section key={category.id} className="space-y-4">
                <div className="flex items-center justify-between">
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
                    {category.items.map((item) => (
                      <Card key={item.id} className="border-border/70 shadow-sm">
                        <CardHeader className="space-y-2">
                          <CardTitle className="text-lg">{item.name}</CardTitle>
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
                                No measurement options configured.
                              </p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {item.measurements.map((measurement) => (
                                  <span
                                    key={measurement.id}
                                    className="rounded-full border border-border/70 px-3 py-1 text-xs"
                                  >
                                    {measurementEnumToLabel[measurement.unit]} •{" "}
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
                                })),
                              }))}
                            />
                          ) : null}
                          {item.modifierGroups.length > 0 ? (
                            <div className="space-y-2">
                              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                                Modifiers
                              </p>
                              <div className="space-y-3">
                                {item.modifierGroups.map((group) => (
                                  <div key={group.id} className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                      <span className="font-semibold">
                                        {group.name}
                                      </span>
                                      <span className="rounded-full border border-border/70 px-2 py-0.5 text-[10px] uppercase">
                                        {group.isRequired
                                          ? "Required"
                                          : "Optional"}
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
                                          {option.name} •{" "}
                                          {formatCurrency(Number(option.priceDelta))}
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
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
