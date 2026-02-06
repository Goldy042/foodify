import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { getUserFromSession } from "@/app/lib/session";
import {
  areaEnumToLabel,
  areaLabelToEnum,
  cuisineEnumToLabel,
  mapCuisineTypes,
  prepTimeLabelToEnum,
  prepTimeEnumToLabel,
} from "@/app/lib/db";
import { listApprovedRestaurants } from "@/app/lib/db";
import { Role } from "@/app/generated/prisma/client";
import {
  areaOptions,
  cuisineTypes,
  prepTimeOptions,
} from "@/app/lib/constants";
import { AppHeader } from "@/components/app/app-header";
import { CustomerFilterModal } from "@/components/customer/customer-filter-modal";
import { Search } from "lucide-react";

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

type PageProps = {
  searchParams?: Promise<{
    area?: string;
    prep?: string;
    cuisine?: string | string[];
    q?: string | string[];
  }>;
};

function normalizeList(input?: string | string[]) {
  if (!input) {
    return [];
  }
  if (Array.isArray(input)) {
    return input.map((value) => value.trim()).filter(Boolean);
  }
  return input
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export default async function CustomerDashboardPage({
  searchParams,
}: PageProps) {
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

  const searchQuery = Array.isArray(resolvedSearchParams.q)
    ? resolvedSearchParams.q[0]?.trim() ?? ""
    : typeof resolvedSearchParams.q === "string"
      ? resolvedSearchParams.q.trim()
      : "";
  const selectedArea = areaOptions.includes(
    resolvedSearchParams.area as (typeof areaOptions)[number]
  )
    ? (resolvedSearchParams.area as (typeof areaOptions)[number])
    : "";
  const selectedPrepTime = prepTimeOptions.includes(
    resolvedSearchParams.prep as (typeof prepTimeOptions)[number]
  )
    ? (resolvedSearchParams.prep as (typeof prepTimeOptions)[number])
    : "";
  const selectedCuisineLabels = normalizeList(resolvedSearchParams.cuisine).filter(
    (value) => cuisineTypes.includes(value as (typeof cuisineTypes)[number])
  );

  const mappedArea = selectedArea
    ? areaLabelToEnum[selectedArea as keyof typeof areaLabelToEnum]
    : undefined;
  const mappedPrepTime = selectedPrepTime
    ? prepTimeLabelToEnum[selectedPrepTime as keyof typeof prepTimeLabelToEnum]
    : undefined;
  const mappedCuisine = selectedCuisineLabels.length
    ? mapCuisineTypes(selectedCuisineLabels)
    : null;

  const restaurants = await listApprovedRestaurants({
    area: mappedArea,
    prepTimeRange: mappedPrepTime,
    cuisineTypes: mappedCuisine ?? undefined,
    query: searchQuery || undefined,
  });
  const activeFilterCount =
    (selectedArea ? 1 : 0) +
    (selectedPrepTime ? 1 : 0) +
    selectedCuisineLabels.length;
  const hasFilters = activeFilterCount > 0;
  const quickCuisines = cuisineTypes.slice(0, 8);

  const buildCuisineHref = (cuisine: string) => {
    const params = new URLSearchParams();
    if (searchQuery) {
      params.set("q", searchQuery);
    }
    if (selectedArea) {
      params.set("area", selectedArea);
    }
    if (selectedPrepTime) {
      params.set("prep", selectedPrepTime);
    }
    selectedCuisineLabels.forEach((value) => {
      params.append("cuisine", value);
    });
    if (!selectedCuisineLabels.includes(cuisine)) {
      params.append("cuisine", cuisine);
    }
    return `/customer?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-20 pt-10">
        <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-primary/90 via-amber-400/80 to-amber-200/80 p-8 text-primary-foreground shadow-sm">
          <div className="pointer-events-none absolute -right-16 -top-24 h-48 w-48 rounded-full bg-white/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-6 h-24 w-24 rounded-full bg-white/30 blur-2xl" />
          <div className="relative z-10 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.4em] text-primary-foreground/80">
                  Customer marketplace
                </p>
                <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                  What are you craving today?
                </h1>
                <p className="max-w-2xl text-sm text-primary-foreground/85">
                  Explore verified restaurants, filter by prep time, and find
                  your next meal in seconds.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="secondary" className="bg-white/90">
                  <Link href="/customer/orders">View orders</Link>
                </Button>
                <Button asChild variant="secondary" className="bg-white/90">
                  <Link href="/customer/profile">Edit profile</Link>
                </Button>
              </div>
            </div>

            <form method="GET" className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-primary-foreground/70" />
                <Input
                  name="q"
                  placeholder="Search restaurants, cuisine, or areas"
                  defaultValue={searchQuery}
                  className="h-12 rounded-full border-white/30 bg-white/15 pl-12 pr-4 text-primary-foreground placeholder:text-primary-foreground/70 focus-visible:ring-white/60"
                />
                {selectedArea ? (
                  <input type="hidden" name="area" value={selectedArea} />
                ) : null}
                {selectedPrepTime ? (
                  <input type="hidden" name="prep" value={selectedPrepTime} />
                ) : null}
                {selectedCuisineLabels.map((value) => (
                  <input key={value} type="hidden" name="cuisine" value={value} />
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="submit" variant="secondary" className="h-12 rounded-full bg-white/90">
                  Search
                </Button>
                <CustomerFilterModal
                  areaOptions={areaOptions}
                  prepTimeOptions={prepTimeOptions}
                  cuisineTypes={cuisineTypes}
                  selectedArea={selectedArea}
                  selectedPrepTime={selectedPrepTime}
                  selectedCuisineLabels={selectedCuisineLabels}
                  searchQuery={searchQuery}
                  activeCount={activeFilterCount}
                />
              </div>
            </form>

            <div className="flex flex-wrap items-center gap-2 text-xs text-primary-foreground/80">
              {quickCuisines.map((cuisine) => (
                <Link
                  key={cuisine}
                  href={buildCuisineHref(cuisine)}
                  className={`rounded-full border px-3 py-1 transition ${
                    selectedCuisineLabels.includes(cuisine)
                      ? "border-white bg-white text-primary"
                      : "border-white/40 bg-white/10 hover:bg-white/20"
                  }`}
                >
                  {cuisine}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                Marketplace results
              </p>
              <h2 className="text-2xl font-semibold md:text-3xl">
                {searchQuery ? `Results for “${searchQuery}”` : "Restaurants near you"}
              </h2>
              <p className="text-sm text-muted-foreground">
                Showing {restaurants.length} restaurant
                {restaurants.length === 1 ? "" : "s"} right now.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchQuery ? (
                <span className="rounded-full border border-border/60 bg-background px-3 py-1 text-xs text-muted-foreground">
                  Search: {searchQuery}
                </span>
              ) : null}
              {selectedArea ? (
                <span className="rounded-full border border-border/60 bg-background px-3 py-1 text-xs text-muted-foreground">
                  Area: {selectedArea}
                </span>
              ) : null}
              {selectedPrepTime ? (
                <span className="rounded-full border border-border/60 bg-background px-3 py-1 text-xs text-muted-foreground">
                  Prep: {selectedPrepTime}
                </span>
              ) : null}
              {selectedCuisineLabels.map((cuisine) => (
                <span
                  key={cuisine}
                  className="rounded-full border border-border/60 bg-background px-3 py-1 text-xs text-muted-foreground"
                >
                  {cuisine}
                </span>
              ))}
              {hasFilters || searchQuery ? (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/customer">Clear all</Link>
                </Button>
              ) : null}
            </div>
          </div>

          {restaurants.length === 0 ? (
            <Card className="border-border/60 bg-card/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">
                  {hasFilters || searchQuery ? "No matches found" : "No restaurants yet"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {hasFilters || searchQuery
                    ? "Try adjusting your search or filters to see available restaurants."
                    : "We are onboarding restaurants. Check back soon."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {restaurants.map((restaurant) => (
                <Card
                  key={restaurant.id}
                  className="group overflow-hidden border-border/60 bg-card/80 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative h-40 overflow-hidden bg-muted">
                    {restaurant.logoUrl ? (
                      <img
                        src={restaurant.logoUrl}
                        alt={restaurant.restaurantName}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-200 via-orange-100 to-white text-lg font-semibold text-amber-900/70">
                        {restaurant.restaurantName.slice(0, 1)}
                      </div>
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
                      {areaEnumToLabel[restaurant.area]}
                    </span>
                  </div>
                  <CardContent className="space-y-3 pt-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-lg font-semibold">
                        {restaurant.restaurantName}
                      </p>
                      <p className="text-muted-foreground">
                        {formatCuisineList(restaurant.cuisineTypes)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full border border-border/60 px-3 py-1">
                        Prep {prepTimeEnumToLabel[restaurant.prepTimeRange]}
                      </span>
                      <span className="rounded-full border border-border/60 px-3 py-1">
                        {restaurant.openTime} - {restaurant.closeTime}
                      </span>
                    </div>
                    <Button asChild type="button" size="sm" className="w-full">
                      <Link href={`/restaurants/${restaurant.id}`}>
                        View menu
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
