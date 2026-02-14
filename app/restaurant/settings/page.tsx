import Link from "next/link";
import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";
import { AppHeader } from "@/components/app/app-header";
import { CloudinaryDirectUploadField } from "@/components/forms/cloudinary-direct-upload-field";
import { MultiCheckboxGroup } from "@/components/forms/multi-checkbox-group";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  areaOptions,
  cuisineTypes,
  dayOptions,
  prepTimeOptions,
} from "@/app/lib/constants";
import {
  areaEnumToLabel,
  areaLabelToEnum,
  cuisineEnumToLabel,
  mapCuisineTypes,
  mapDays,
  dayEnumToLabel,
  prepTimeEnumToLabel,
  prepTimeLabelToEnum,
} from "@/app/lib/db";
import { parseTimeToMinutes } from "@/app/lib/restaurant-availability";
import { requireRestaurantUser } from "@/app/restaurant/_lib/guards";

type PageProps = {
  searchParams?: Promise<{ status?: string; error?: string }> | { status?: string; error?: string };
};

const successMessages: Record<string, string> = {
  "settings-saved": "Restaurant settings updated.",
};

const errorMessages: Record<string, string> = {
  "profile-not-found": "Restaurant profile was not found.",
  "invalid-profile": "Enter valid profile values and try again.",
  "invalid-hours": "Opening and closing hours must be valid times.",
  "invalid-logo-url": "Logo must be a valid HTTPS image URL.",
};

const logoPattern = /^https:\/\/.+/i;

function getProfileChecklist(input: {
  logoUrl: string;
  phoneNumber: string;
  streetAddress: string;
  openTime: string;
  closeTime: string;
  cuisineCount: number;
}) {
  return [
    {
      key: "logo",
      label: "Logo image",
      complete: logoPattern.test(input.logoUrl.trim()),
    },
    {
      key: "hours",
      label: "Operating hours",
      complete:
        parseTimeToMinutes(input.openTime) !== null &&
        parseTimeToMinutes(input.closeTime) !== null,
    },
    {
      key: "address",
      label: "Street address",
      complete: input.streetAddress.trim().length > 0,
    },
    {
      key: "cuisines",
      label: "Cuisine tags",
      complete: input.cuisineCount > 0,
    },
    {
      key: "contact",
      label: "Phone contact",
      complete: input.phoneNumber.trim().length > 0,
    },
  ];
}

export default async function RestaurantSettingsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const user = await requireRestaurantUser();

  const restaurant = await prisma.restaurantProfile.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      restaurantName: true,
      logoUrl: true,
      phoneNumber: true,
      streetAddress: true,
      area: true,
      city: true,
      cuisineTypes: true,
      openTime: true,
      closeTime: true,
      daysOpen: true,
      prepTimeRange: true,
    },
  });

  if (!restaurant) {
    redirect("/onboarding/restaurant");
  }

  async function saveRestaurantSettings(formData: FormData) {
    "use server";

    const authedUser = await requireRestaurantUser();
    const existingProfile = await prisma.restaurantProfile.findUnique({
      where: { userId: authedUser.id },
      select: {
        id: true,
        logoUrl: true,
      },
    });

    if (!existingProfile) {
      redirect("/restaurant/settings?error=profile-not-found");
    }

    const restaurantName = String(formData.get("restaurantName") || "").trim();
    const phoneNumber = String(formData.get("phoneNumber") || "").trim();
    const streetAddress = String(formData.get("streetAddress") || "").trim();
    const areaLabel = String(formData.get("area") || "").trim();
    const city = String(formData.get("city") || "").trim();
    const openTime = String(formData.get("openTime") || "").trim();
    const closeTime = String(formData.get("closeTime") || "").trim();
    const prepTimeLabel = String(formData.get("prepTimeRange") || "").trim();
    const logoUrlInput = String(formData.get("logoUrl") || "").trim();

    const cuisineLabels = formData
      .getAll("cuisineTypes")
      .map((value) => String(value).trim())
      .filter(Boolean);
    const dayLabels = formData
      .getAll("daysOpen")
      .map((value) => String(value).trim())
      .filter(Boolean);

    const area = areaLabelToEnum[areaLabel as keyof typeof areaLabelToEnum];
    const prepTimeRange =
      prepTimeLabelToEnum[prepTimeLabel as keyof typeof prepTimeLabelToEnum];
    const mappedCuisineTypes = mapCuisineTypes(cuisineLabels);
    const mappedDays = mapDays(dayLabels);

    if (
      !restaurantName ||
      !phoneNumber ||
      !streetAddress ||
      !city ||
      !area ||
      !prepTimeRange ||
      !mappedCuisineTypes ||
      mappedCuisineTypes.length === 0 ||
      !mappedDays ||
      mappedDays.length === 0
    ) {
      redirect("/restaurant/settings?error=invalid-profile");
    }

    if (parseTimeToMinutes(openTime) === null || parseTimeToMinutes(closeTime) === null) {
      redirect("/restaurant/settings?error=invalid-hours");
    }

    const logoUrl = logoUrlInput || existingProfile.logoUrl;
    if (!logoPattern.test(logoUrl)) {
      redirect("/restaurant/settings?error=invalid-logo-url");
    }

    await prisma.restaurantProfile.update({
      where: { id: existingProfile.id },
      data: {
        restaurantName,
        logoUrl,
        phoneNumber,
        streetAddress,
        area,
        city,
        cuisineTypes: mappedCuisineTypes,
        openTime,
        closeTime,
        daysOpen: mappedDays,
        prepTimeRange,
      },
    });

    redirect("/restaurant/settings?status=settings-saved");
  }

  const [totalMenuItems, sellableMenuItems, invalidPricingSetupItems] = await Promise.all([
    prisma.menuItem.count({ where: { restaurantId: restaurant.id } }),
    prisma.menuItem.count({
      where: {
        restaurantId: restaurant.id,
        isAvailable: true,
        measurements: {
          some: {
            basePrice: { gt: 0 },
          },
        },
      },
    }),
    prisma.menuItem.count({
      where: {
        restaurantId: restaurant.id,
        measurements: {
          none: {
            basePrice: { gt: 0 },
          },
        },
      },
    }),
  ]);

  const checklist = getProfileChecklist({
    logoUrl: restaurant.logoUrl,
    phoneNumber: restaurant.phoneNumber,
    streetAddress: restaurant.streetAddress,
    openTime: restaurant.openTime,
    closeTime: restaurant.closeTime,
    cuisineCount: restaurant.cuisineTypes.length,
  });

  const completeCount = checklist.filter((item) => item.complete).length;
  const completionScore = Math.round((completeCount / checklist.length) * 100);
  const hasMissingProfileInfo = completeCount < checklist.length;

  const warnings: string[] = [];
  if (sellableMenuItems === 0) {
    warnings.push("No sellable menu items are currently visible to customers.");
  }
  if (hasMissingProfileInfo) {
    warnings.push("Critical profile information is still incomplete.");
  }
  if (invalidPricingSetupItems > 0) {
    warnings.push(
      `${invalidPricingSetupItems} menu item${invalidPricingSetupItems === 1 ? "" : "s"} have no valid measurement pricing.`
    );
  }

  const selectedCuisineLabels = restaurant.cuisineTypes.map(
    (cuisineType) => cuisineEnumToLabel[cuisineType]
  );
  const selectedDayLabels = restaurant.daysOpen.map((day) => dayEnumToLabel[day]);
  const selectedArea = areaEnumToLabel[restaurant.area];
  const selectedPrepTime = prepTimeEnumToLabel[restaurant.prepTimeRange];

  const statusMessage = resolvedSearchParams.status
    ? successMessages[resolvedSearchParams.status]
    : null;
  const errorMessage = resolvedSearchParams.error
    ? errorMessages[resolvedSearchParams.error]
    : null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Restaurant</p>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                Restaurant Settings
              </h1>
              <p className="text-sm text-muted-foreground">
                Keep your profile complete and menu quality high across restaurant and customer surfaces.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/restaurant">Back to dashboard</Link>
            </Button>
          </div>
        </header>

        {statusMessage ? (
          <div className="rounded-lg border border-emerald-300/60 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {statusMessage}
          </div>
        ) : null}
        {errorMessage ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        {warnings.length > 0 ? (
          <Card className="border-amber-300/70 bg-amber-50/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Operational consistency warnings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-amber-900">
              {warnings.map((warning) => (
                <p key={warning}>- {warning}</p>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border/70 shadow-sm">
            <CardContent className="space-y-1 py-4">
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Profile completion</p>
              <p className="text-3xl font-semibold">{completionScore}%</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardContent className="space-y-1 py-4">
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Checklist done</p>
              <p className="text-3xl font-semibold">{completeCount}/{checklist.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardContent className="space-y-1 py-4">
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Sellable items</p>
              <p className="text-3xl font-semibold">{sellableMenuItems}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardContent className="space-y-1 py-4">
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Pricing issues</p>
              <p className="text-3xl font-semibold">{invalidPricingSetupItems}</p>
            </CardContent>
          </Card>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1fr_1.25fr]">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Completion checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {checklist.map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2">
                  <span>{item.label}</span>
                  <span
                    className={`rounded-full border px-2 py-1 text-xs ${
                      item.complete
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-border/70 bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    {item.complete ? "Complete" : "Missing"}
                  </span>
                </div>
              ))}
              <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                {totalMenuItems} menu item{totalMenuItems === 1 ? "" : "s"} total in catalog.
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Profile editor</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={saveRestaurantSettings} className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="restaurantName">Restaurant name</Label>
                  <Input id="restaurantName" name="restaurantName" defaultValue={restaurant.restaurantName} required />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone number</Label>
                    <Input id="phoneNumber" name="phoneNumber" defaultValue={restaurant.phoneNumber} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" defaultValue={restaurant.city} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="streetAddress">Street address</Label>
                  <Input id="streetAddress" name="streetAddress" defaultValue={restaurant.streetAddress} required />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="area">Area</Label>
                    <select
                      id="area"
                      name="area"
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      defaultValue={selectedArea}
                    >
                      {areaOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prepTimeRange">Prep time range</Label>
                    <select
                      id="prepTimeRange"
                      name="prepTimeRange"
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      defaultValue={selectedPrepTime}
                    >
                      {prepTimeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="openTime">Open time</Label>
                    <Input id="openTime" name="openTime" type="time" defaultValue={restaurant.openTime} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="closeTime">Close time</Label>
                    <Input id="closeTime" name="closeTime" type="time" defaultValue={restaurant.closeTime} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Days open</Label>
                  <MultiCheckboxGroup
                    name="daysOpen"
                    options={dayOptions}
                    defaultValues={selectedDayLabels}
                    columns={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cuisine tags</Label>
                  <MultiCheckboxGroup
                    name="cuisineTypes"
                    options={cuisineTypes}
                    defaultValues={selectedCuisineLabels}
                    columns={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Restaurant logo</Label>
                  <CloudinaryDirectUploadField
                    name="logoUrl"
                    defaultValue={restaurant.logoUrl}
                    helpText="Upload a square logo image to improve storefront trust."
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit">Save settings</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
