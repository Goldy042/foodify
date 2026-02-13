import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app/app-header";
import { MultiCheckboxGroup } from "@/components/forms/multi-checkbox-group";
import { SelectField } from "@/components/forms/select-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DayOfWeek, Role } from "@/app/generated/prisma/client";
import {
  areaOptions,
  cuisineTypes,
  prepTimeOptions,
} from "@/app/lib/constants";
import {
  areaEnumToLabel,
  areaLabelToEnum,
  cuisineEnumToLabel,
  getCustomerProfile,
  listApprovedRestaurants,
  mapCuisineTypes,
  prepTimeEnumToLabel,
  prepTimeLabelToEnum,
} from "@/app/lib/db";
import {
  calculateDistanceKm,
  DEFAULT_SERVICE_RADIUS_KM,
  isRestaurantOpenNow,
} from "@/app/lib/restaurant-availability";
import { getUserFromSession } from "@/app/lib/session";

type PageProps = {
  searchParams?: Promise<{
    area?: string | string[];
    prep?: string | string[];
    cuisine?: string | string[];
    open?: string | string[];
    q?: string | string[];
    sort?: string | string[];
    page?: string | string[];
  }>;
};

const SORT_OPTIONS = ["Recommended", "Fast Prep", "Newest"] as const;
const STATUS_OPTIONS = ["Open now"] as const;
const DEFAULT_SORT_OPTION = "Recommended";
const PAGE_SIZE = 8;

const sortOptionToValue = {
  Recommended: "recommended",
  "Fast Prep": "prep",
  Newest: "newest",
} as const;

function getFirstValue(input?: string | string[]) {
  if (!input) {
    return "";
  }
  return Array.isArray(input) ? input[0] ?? "" : input;
}

function parsePositiveInt(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

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

function formatCuisineList(cuisine: readonly string[]) {
  if (cuisine.length === 0) {
    return "Cuisine info unavailable";
  }
  const labels = cuisine.map(
    (item) => cuisineEnumToLabel[item as keyof typeof cuisineEnumToLabel] ?? item
  );
  return labels.join(" | ");
}

function getOpenStatus(daysOpen: readonly DayOfWeek[], openTime: string, closeTime: string) {
  const isOpen = isRestaurantOpenNow({
    daysOpen,
    openTime,
    closeTime,
  });
  return { isOpen, label: isOpen ? "Open now" : "Closed now" };
}

function buildRestaurantsHref(options: {
  selectedArea: string;
  selectedPrepTime: string;
  selectedCuisineLabels: string[];
  selectedOpenNow: boolean;
  searchQuery: string;
  selectedSortOption: (typeof SORT_OPTIONS)[number];
  page: number;
}) {
  const params = new URLSearchParams();
  if (options.selectedArea) {
    params.set("area", options.selectedArea);
  }
  if (options.selectedPrepTime) {
    params.set("prep", options.selectedPrepTime);
  }
  for (const cuisine of options.selectedCuisineLabels) {
    params.append("cuisine", cuisine);
  }
  if (options.selectedOpenNow) {
    params.set("open", "1");
  }
  if (options.searchQuery) {
    params.set("q", options.searchQuery);
  }
  if (options.selectedSortOption !== DEFAULT_SORT_OPTION) {
    params.set("sort", options.selectedSortOption);
  }
  if (options.page > 1) {
    params.set("page", String(options.page));
  }
  const query = params.toString();
  return query ? `/restaurants?${query}` : "/restaurants";
}

type ActiveFilter = {
  key: string;
  label: string;
  href: string;
};

export default async function RestaurantsPage({ searchParams }: PageProps) {
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

  const selectedArea = areaOptions.includes(
    getFirstValue(resolvedSearchParams.area) as (typeof areaOptions)[number]
  )
    ? (getFirstValue(resolvedSearchParams.area) as (typeof areaOptions)[number])
    : "";
  const selectedPrepTime = prepTimeOptions.includes(
    getFirstValue(resolvedSearchParams.prep) as (typeof prepTimeOptions)[number]
  )
    ? (getFirstValue(resolvedSearchParams.prep) as (typeof prepTimeOptions)[number])
    : "";
  const selectedCuisineLabels = normalizeList(resolvedSearchParams.cuisine).filter(
    (value) => cuisineTypes.includes(value as (typeof cuisineTypes)[number])
  );
  const openFilterRaw = getFirstValue(resolvedSearchParams.open).toLowerCase();
  const selectedOpenNow =
    openFilterRaw === "1" ||
    openFilterRaw === "true" ||
    openFilterRaw === "open now";
  const rawSort = getFirstValue(resolvedSearchParams.sort);
  const selectedSortOption = SORT_OPTIONS.includes(
    rawSort as (typeof SORT_OPTIONS)[number]
  )
    ? (rawSort as (typeof SORT_OPTIONS)[number])
    : DEFAULT_SORT_OPTION;
  const sortBy = sortOptionToValue[selectedSortOption];
  const searchQuery = getFirstValue(resolvedSearchParams.q).trim();
  const requestedPage = parsePositiveInt(getFirstValue(resolvedSearchParams.page));

  const mappedArea = selectedArea
    ? areaLabelToEnum[selectedArea as keyof typeof areaLabelToEnum]
    : undefined;
  const mappedPrepTime = selectedPrepTime
    ? prepTimeLabelToEnum[selectedPrepTime as keyof typeof prepTimeLabelToEnum]
    : undefined;
  const mappedCuisine = selectedCuisineLabels.length
    ? mapCuisineTypes(selectedCuisineLabels)
    : null;

  const listing = await listApprovedRestaurants({
    area: mappedArea,
    prepTimeRange: mappedPrepTime,
    cuisineTypes: mappedCuisine ?? undefined,
    openNow: selectedOpenNow,
    customerLat: Number(profile.defaultAddressLat),
    customerLng: Number(profile.defaultAddressLng),
    maxDistanceKm: DEFAULT_SERVICE_RADIUS_KM,
    search: searchQuery || undefined,
    sortBy,
    page: requestedPage,
    pageSize: PAGE_SIZE,
  });

  const hasFilters =
    Boolean(selectedArea) ||
    Boolean(selectedPrepTime) ||
    selectedCuisineLabels.length > 0 ||
    selectedOpenNow ||
    Boolean(searchQuery);
  const activeFilterCount =
    (selectedArea ? 1 : 0) +
    (selectedPrepTime ? 1 : 0) +
    selectedCuisineLabels.length +
    (selectedOpenNow ? 1 : 0) +
    (searchQuery ? 1 : 0);
  const showingFrom =
    listing.total === 0 ? 0 : (listing.page - 1) * listing.pageSize + 1;
  const showingTo =
    listing.total === 0
      ? 0
      : (listing.page - 1) * listing.pageSize + listing.restaurants.length;
  const activeFilters: ActiveFilter[] = [];

  if (selectedArea) {
    activeFilters.push({
      key: `area:${selectedArea}`,
      label: `Area: ${selectedArea}`,
      href: buildRestaurantsHref({
        selectedArea: "",
        selectedPrepTime,
        selectedCuisineLabels,
        selectedOpenNow,
        searchQuery,
        selectedSortOption,
        page: 1,
      }),
    });
  }

  if (selectedPrepTime) {
    activeFilters.push({
      key: `prep:${selectedPrepTime}`,
      label: `Prep: ${selectedPrepTime}`,
      href: buildRestaurantsHref({
        selectedArea,
        selectedPrepTime: "",
        selectedCuisineLabels,
        selectedOpenNow,
        searchQuery,
        selectedSortOption,
        page: 1,
      }),
    });
  }

  for (const cuisine of selectedCuisineLabels) {
    activeFilters.push({
      key: `cuisine:${cuisine}`,
      label: `Cuisine: ${cuisine}`,
      href: buildRestaurantsHref({
        selectedArea,
        selectedPrepTime,
        selectedCuisineLabels: selectedCuisineLabels.filter(
          (entry) => entry !== cuisine
        ),
        selectedOpenNow,
        searchQuery,
        selectedSortOption,
        page: 1,
      }),
    });
  }

  if (selectedOpenNow) {
    activeFilters.push({
      key: "open:now",
      label: "Open now",
      href: buildRestaurantsHref({
        selectedArea,
        selectedPrepTime,
        selectedCuisineLabels,
        selectedOpenNow: false,
        searchQuery,
        selectedSortOption,
        page: 1,
      }),
    });
  }

  if (searchQuery) {
    activeFilters.push({
      key: `search:${searchQuery}`,
      label: `Search: ${searchQuery}`,
      href: buildRestaurantsHref({
        selectedArea,
        selectedPrepTime,
        selectedCuisineLabels,
        selectedOpenNow,
        searchQuery: "",
        selectedSortOption,
        page: 1,
      }),
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Restaurants
          </p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                Browse approved restaurants
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Verified restaurants that are currently live on Foodify.
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
                <p className="text-base font-semibold">Refine restaurants</p>
              </div>
              <span className="rounded-full border border-primary-foreground/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                {hasFilters ? `${activeFilterCount} active` : "Collapsed"}
              </span>
            </summary>
            <div className="px-6 pb-6 pt-5">
              <form method="GET" className="grid gap-6 md:grid-cols-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="q">Search</Label>
                  <Input
                    id="q"
                    name="q"
                    defaultValue={searchQuery}
                    placeholder="Search by restaurant name or cuisine"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sort</Label>
                  <SelectField
                    name="sort"
                    options={SORT_OPTIONS}
                    defaultValue={selectedSortOption}
                  />
                </div>
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
                <div className="space-y-2">
                  <Label>Status</Label>
                  <SelectField
                    name="open"
                    options={STATUS_OPTIONS}
                    placeholder="Any status"
                    defaultValue={selectedOpenNow ? "Open now" : ""}
                  />
                </div>
                <div className="space-y-2 md:col-span-4">
                  <Label>Cuisine</Label>
                  <MultiCheckboxGroup
                    name="cuisine"
                    options={cuisineTypes}
                    defaultValues={selectedCuisineLabels}
                    columns={3}
                  />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:col-span-4">
                  <p className="text-xs text-muted-foreground">
                    Filters, search, and sorting apply when you submit the form.
                  </p>
                  <div className="flex gap-3">
                    <Button type="submit">Apply</Button>
                    <Button asChild variant="outline">
                      <Link href="/restaurants">Clear</Link>
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </details>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>
            Showing {showingFrom}-{showingTo} of {listing.total}
          </p>
          <p>
            Sorted by {selectedSortOption} | Within {DEFAULT_SERVICE_RADIUS_KM}km
          </p>
        </div>
        {activeFilters.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Active filters
            </span>
            {activeFilters.map((filter) => (
              <Button key={filter.key} asChild size="sm" variant="outline">
                <Link href={filter.href}>{filter.label} x</Link>
              </Button>
            ))}
          </div>
        ) : null}

        {listing.restaurants.length === 0 ? (
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
          <>
            <div className="grid gap-5 md:grid-cols-2">
              {listing.restaurants.map((restaurant) => {
                const openStatus = getOpenStatus(
                  restaurant.daysOpen,
                  restaurant.openTime,
                  restaurant.closeTime
                );
                const distanceKm = calculateDistanceKm(
                  {
                    lat: profile.defaultAddressLat,
                    lng: profile.defaultAddressLng,
                  },
                  {
                    lat: restaurant.addressLat,
                    lng: restaurant.addressLng,
                  }
                );
                const distanceLabel =
                  distanceKm === null
                    ? "Distance unavailable"
                    : `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km away`;

                return (
                  <Card key={restaurant.id} className="border-border/70 shadow-sm">
                    <CardHeader className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 overflow-hidden rounded-xl border border-border/70 bg-muted/30">
                            {restaurant.logoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={restaurant.logoUrl}
                                alt={`${restaurant.restaurantName} logo`}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">
                                {restaurant.restaurantName.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="space-y-1">
                            <CardTitle className="text-xl">
                              {restaurant.restaurantName}
                            </CardTitle>
                            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                              {areaEnumToLabel[restaurant.area]}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                            openStatus.isOpen
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-border/70 bg-muted/40 text-muted-foreground"
                          }`}
                        >
                          {openStatus.label}
                        </span>
                      </div>
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
                        <span className="rounded-full border border-border/70 px-3 py-1">
                          {distanceLabel}
                        </span>
                        <span className="rounded-full border border-border/70 px-3 py-1">
                          {restaurant._count.menuItems} menu item
                          {restaurant._count.menuItems === 1 ? "" : "s"}
                        </span>
                      </div>
                      <Button asChild type="button" variant="outline">
                        <Link href={`/restaurants/${restaurant.id}`}>View menu</Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {listing.totalPages > 1 ? (
              <div className="flex flex-wrap items-center justify-end gap-2">
                {listing.hasPreviousPage ? (
                  <Button asChild variant="outline">
                    <Link
                      href={buildRestaurantsHref({
                        selectedArea,
                        selectedPrepTime,
                        selectedCuisineLabels,
                        selectedOpenNow,
                        searchQuery,
                        selectedSortOption,
                        page: listing.page - 1,
                      })}
                    >
                      Previous
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" disabled>
                    Previous
                  </Button>
                )}

                <span className="px-3 text-xs text-muted-foreground">
                  Page {listing.page} of {listing.totalPages}
                </span>

                {listing.hasNextPage ? (
                  <Button asChild variant="outline">
                    <Link
                      href={buildRestaurantsHref({
                        selectedArea,
                        selectedPrepTime,
                        selectedCuisineLabels,
                        selectedOpenNow,
                        searchQuery,
                        selectedSortOption,
                        page: listing.page + 1,
                      })}
                    >
                      Next
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" disabled>
                    Next
                  </Button>
                )}
              </div>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}
