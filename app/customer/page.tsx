import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { SelectField } from "@/components/forms/select-field";
import { MultiCheckboxGroup } from "@/components/forms/multi-checkbox-group";
import { AppHeader } from "@/components/app/app-header";

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
  });
  const hasFilters =
    Boolean(selectedArea) ||
    Boolean(selectedPrepTime) ||
    selectedCuisineLabels.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Customer dashboard
          </p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                Browse approved restaurants.
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                These restaurants are verified and live on Foodify. Menus and
                checkout flow will connect here next.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/customer/orders">View orders</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/customer/profile">Edit profile</Link>
              </Button>
            </div>
          </div>
        </header>

        <Card className="border-border/70 shadow-sm">
          <details className="group" open={hasFilters}>
            <summary className="flex cursor-pointer items-center justify-between gap-4 rounded-lg bg-primary px-6 py-4 text-primary-foreground">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-primary-foreground/80">
                  Filters
                </p>
                <p className="text-base font-semibold">
                  Refine restaurants
                </p>
              </div>
              <span className="rounded-full border border-primary-foreground/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                {hasFilters
                  ? `${selectedCuisineLabels.length + (selectedArea ? 1 : 0) + (selectedPrepTime ? 1 : 0)} active`
                  : "Collapsed"}
              </span>
            </summary>
            <div className="px-6 pb-6 pt-5">
              <form method="GET" className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Area</Label>
                  <SelectField
                    name="area"
                    options={areaOptions}
                    placeholder="All areas"
                    defaultValue={selectedArea}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prep time</Label>
                  <SelectField
                    name="prep"
                    options={prepTimeOptions}
                    placeholder="Any prep time"
                    defaultValue={selectedPrepTime}
                  />
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label>Cuisine</Label>
                  <MultiCheckboxGroup
                    name="cuisine"
                    options={cuisineTypes}
                    defaultValues={selectedCuisineLabels}
                    columns={3}
                  />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:col-span-3">
                  <p className="text-xs text-muted-foreground">
                    Filters apply instantly when you submit the form.
                  </p>
                  <div className="flex gap-3">
                    <Button type="submit">Apply filters</Button>
                    <Button asChild variant="outline">
                      <Link href="/customer">Clear filters</Link>
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </details>
        </Card>

        {restaurants.length === 0 ? (
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">
                {hasFilters ? "No matches found" : "No restaurants yet"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {hasFilters
                  ? "Try adjusting your filters to see available restaurants."
                  : "We are onboarding restaurants. Check back soon."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {restaurants.map((restaurant) => (
              <Card key={restaurant.id} className="border-border/70 shadow-sm">
                <CardHeader className="space-y-2">
                  <CardTitle className="text-xl">
                    {restaurant.restaurantName}
                  </CardTitle>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    {areaEnumToLabel[restaurant.area]}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    {formatCuisineList(restaurant.cuisineTypes)}
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="rounded-full border border-border/70 px-3 py-1">
                      Prep {prepTimeEnumToLabel[restaurant.prepTimeRange]}
                    </span>
                    <span className="rounded-full border border-border/70 px-3 py-1">
                      {restaurant.openTime} - {restaurant.closeTime}
                    </span>
                  </div>
                  <Button asChild type="button" variant="outline">
                    <Link href={`/restaurants/${restaurant.id}`}>
                      View menu
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
