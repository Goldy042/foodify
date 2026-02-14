import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock3, MapPin, Sparkles } from "lucide-react";

import { AppHeader } from "@/components/app/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Role, DayOfWeek } from "@/app/generated/prisma/client";
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
const PAGE_SIZE = 9;
const QUICK_SEARCH_TERMS = [
  "Jollof rice",
  "Burger",
  "Shawarma",
  "Pizza",
  "Pasta",
  "Fried rice",
] as const;

const sortOptionToValue = {
  Recommended: "recommended",
  "Fast Prep": "prep",
  Newest: "newest",
} as const;

function getFirstValue(input?: string | string[]) {
  if (!input) return "";
  return Array.isArray(input) ? input[0] ?? "" : input;
}

function parsePositiveInt(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function normalizeList(input?: string | string[]) {
  if (!input) return [];
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
  return cuisine
    .map((item) => cuisineEnumToLabel[item as keyof typeof cuisineEnumToLabel] ?? item)
    .join(" | ");
}

function getOpenStatus(daysOpen: readonly DayOfWeek[], openTime: string, closeTime: string) {
  const isOpen = isRestaurantOpenNow({ daysOpen, openTime, closeTime });
  return { isOpen, label: isOpen ? "Open now" : "Closed" };
}

function buildMarketplaceHref(options: {
  selectedArea: string;
  selectedPrepTime: string;
  selectedCuisineLabels: string[];
  selectedOpenNow: boolean;
  searchQuery: string;
  selectedSortOption: (typeof SORT_OPTIONS)[number] | "";
  page: number;
}) {
  const params = new URLSearchParams();
  if (options.selectedArea) params.set("area", options.selectedArea);
  if (options.selectedPrepTime) params.set("prep", options.selectedPrepTime);
  for (const cuisine of options.selectedCuisineLabels) {
    params.append("cuisine", cuisine);
  }
  if (options.selectedOpenNow) params.set("open", "1");
  if (options.searchQuery) params.set("q", options.searchQuery);
  if (options.selectedSortOption) params.set("sort", options.selectedSortOption);
  if (options.page > 1) params.set("page", String(options.page));
  const query = params.toString();
  return query ? `/app?${query}` : "/app";
}

export default async function MarketplacePage({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const user = await getUserFromSession();
  if (!user) redirect("/login");
  if (user.role !== Role.CUSTOMER) {
    redirect(`/onboarding/${user.role.toLowerCase()}`);
  }
  if (user.status === "EMAIL_UNVERIFIED") {
    redirect(`/signup/verify?email=${encodeURIComponent(user.email)}`);
  }
  if (user.status !== "PROFILE_COMPLETED") redirect("/onboarding/customer");

  const profile = await getCustomerProfile(user.id);
  if (!profile) redirect("/onboarding/customer");

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

  const selectedCuisineLabels = normalizeList(resolvedSearchParams.cuisine).filter((value) =>
    cuisineTypes.includes(value as (typeof cuisineTypes)[number])
  );

  const openFilterRaw = getFirstValue(resolvedSearchParams.open).toLowerCase();
  const selectedOpenNow =
    openFilterRaw === "1" || openFilterRaw === "true" || openFilterRaw === "open";

  const rawSort = getFirstValue(resolvedSearchParams.sort);
  const selectedSortOption = SORT_OPTIONS.includes(rawSort as (typeof SORT_OPTIONS)[number])
    ? (rawSort as (typeof SORT_OPTIONS)[number])
    : "";

  const sortBy = selectedSortOption
    ? sortOptionToValue[selectedSortOption as keyof typeof sortOptionToValue]
    : undefined;

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
    search: searchQuery || undefined,
    sortBy,
    page: requestedPage,
    pageSize: PAGE_SIZE,
  });

  const showingFrom = listing.total === 0 ? 0 : (listing.page - 1) * listing.pageSize + 1;
  const showingTo =
    listing.total === 0
      ? 0
      : (listing.page - 1) * listing.pageSize + listing.restaurants.length;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_hsl(26_95%_92%),_hsl(36_70%_98%)_35%,_hsl(36_30%_99%))]">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-16 pt-8 sm:px-6">
        <section className="relative overflow-hidden rounded-3xl border border-orange-200/70 bg-gradient-to-br from-orange-500 via-amber-400 to-rose-400 p-6 text-white shadow-lg md:p-8">
          <div className="pointer-events-none absolute -right-24 -top-16 h-56 w-56 rounded-full bg-white/25 blur-3xl" />
          <div className="relative z-10 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.35em] text-white/85">Marketplace</p>
              <h1 className="font-display text-3xl leading-tight font-semibold md:text-5xl">
                Find your meal. Compare vendors. Order in minutes.
              </h1>
              <p className="max-w-2xl text-sm text-white/90 md:text-base">
                This demo shows all vendors while still displaying estimated distance and prep time in your zone.
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_SEARCH_TERMS.map((term) => (
                  <Button key={term} asChild size="sm" variant="secondary" className="bg-white/90 text-zinc-900 hover:bg-white">
                    <Link
                      href={buildMarketplaceHref({
                        selectedArea,
                        selectedPrepTime,
                        selectedCuisineLabels,
                        selectedOpenNow,
                        searchQuery: term,
                        selectedSortOption,
                        page: 1,
                      })}
                    >
                      {term}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
            <Card className="border-white/30 bg-white/15 text-white shadow-none backdrop-blur">
              <CardContent className="grid gap-3 p-4 text-sm">
                <p className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Combo spotlight: Family Feast + Drinks</p>
                <p className="flex items-center gap-2"><Clock3 className="h-4 w-4" /> Average prep: 20 - 35 min</p>
                <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Location mode: Zone estimate</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Card className="border-border/70 bg-background/90 shadow-sm">
          <CardContent className="p-4 md:p-6">
            <form method="GET" className="grid gap-4 md:grid-cols-5">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="q">Search food or restaurants</Label>
                <Input id="q" name="q" defaultValue={searchQuery} placeholder="e.g. Shawarma, pizza, rice" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">Area</Label>
                <select id="area" name="area" defaultValue={selectedArea} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">All areas</option>
                  {areaOptions.map((option) => (<option key={option} value={option}>{option}</option>))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prep">Prep</Label>
                <select id="prep" name="prep" defaultValue={selectedPrepTime} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">Any prep</option>
                  {prepTimeOptions.map((option) => (<option key={option} value={option}>{option}</option>))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort">Sort</Label>
                <select id="sort" name="sort" defaultValue={selectedSortOption} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">Recommended</option>
                  {SORT_OPTIONS.map((option) => (<option key={option} value={option}>{option}</option>))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-5">
                <Label>Cuisine</Label>
                <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 md:grid-cols-3">
                  {cuisineTypes.map((cuisine) => {
                    const checked = selectedCuisineLabels.includes(cuisine);
                    return (
                      <label key={cuisine} className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2">
                        <input type="checkbox" name="cuisine" value={cuisine} defaultChecked={checked} className="h-4 w-4" />
                        <span>{cuisine}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:col-span-5">
                <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" name="open" value="1" defaultChecked={selectedOpenNow} className="h-4 w-4" />
                  Show only open restaurants
                </label>
                <div className="flex gap-2">
                  <Button asChild variant="outline"><Link href="/app">Clear</Link></Button>
                  <Button type="submit">Search</Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <p>Showing {showingFrom}-{showingTo} of {listing.total} vendors</p>
          <p>Distance is estimated in demo mode</p>
        </div>

        {listing.restaurants.length === 0 ? (
          <Card className="border-border/70 bg-card/80">
            <CardContent className="space-y-3 p-6 text-sm">
              <p className="text-base font-semibold">No matches yet</p>
              <p className="text-muted-foreground">Try another dish or remove some filters.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listing.restaurants.map((restaurant) => {
              const openStatus = getOpenStatus(restaurant.daysOpen, restaurant.openTime, restaurant.closeTime);
              const distanceKm = calculateDistanceKm(
                { lat: profile.defaultAddressLat, lng: profile.defaultAddressLng },
                { lat: restaurant.addressLat, lng: restaurant.addressLng }
              );
              const distanceLabel = distanceKm === null
                ? "Distance unavailable"
                : `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km away`;

              return (
                <Card key={restaurant.id} className="overflow-hidden border-border/70 bg-card/95 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{areaEnumToLabel[restaurant.area]}</p>
                        <h2 className="text-xl font-semibold leading-tight">{restaurant.restaurantName}</h2>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${openStatus.isOpen ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}>
                        {openStatus.label}
                      </span>
                    </div>

                    <p className="line-clamp-2 text-sm text-muted-foreground">{formatCuisineList(restaurant.cuisineTypes)}</p>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-900">Prep {prepTimeEnumToLabel[restaurant.prepTimeRange]}</span>
                      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-zinc-700">{distanceLabel}</span>
                    </div>

                    {restaurant.menuItems.length > 0 ? (
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {restaurant.menuItems.map((item) => (
                          <span key={`${restaurant.id}:${item.name}`} className="rounded-full border border-border/70 px-2.5 py-1">{item.name}</span>
                        ))}
                      </div>
                    ) : null}

                    <Button asChild className="w-full">
                      <Link href={`/app/restaurants/${restaurant.id}`}>View menu</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {listing.totalPages > 1 ? (
          <div className="flex items-center justify-end gap-2">
            {listing.hasPreviousPage ? (
              <Button asChild variant="outline">
                <Link href={buildMarketplaceHref({
                  selectedArea,
                  selectedPrepTime,
                  selectedCuisineLabels,
                  selectedOpenNow,
                  searchQuery,
                  selectedSortOption,
                  page: listing.page - 1,
                })}>Previous</Link>
              </Button>
            ) : (
              <Button variant="outline" disabled>Previous</Button>
            )}
            <span className="px-2 text-xs text-muted-foreground">Page {listing.page} of {listing.totalPages}</span>
            {listing.hasNextPage ? (
              <Button asChild variant="outline">
                <Link href={buildMarketplaceHref({
                  selectedArea,
                  selectedPrepTime,
                  selectedCuisineLabels,
                  selectedOpenNow,
                  searchQuery,
                  selectedSortOption,
                  page: listing.page + 1,
                })}>Next</Link>
              </Button>
            ) : (
              <Button variant="outline" disabled>Next</Button>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}



