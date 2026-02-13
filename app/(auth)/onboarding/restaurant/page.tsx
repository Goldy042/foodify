import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  areaOptions,
  bankOptions,
  cuisineTypes,
  dayOptions,
  prepTimeOptions,
} from "@/app/lib/constants";
import { Role } from "@/app/generated/prisma/client";
import { getUserFromSession } from "@/app/lib/session";
import {
  areaLabelToEnum,
  bankLabelToEnum,
  mapCuisineTypes,
  mapDays,
  prepTimeLabelToEnum,
} from "@/app/lib/db";
import {
  getRestaurantProfile,
  updateUser,
  upsertRestaurantProfile,
} from "@/app/lib/db";
import { AppHeader } from "@/components/app/app-header";

const errorMessages: Record<string, string> = {
  missing: "Please fill in all required fields.",
};

type PageProps = {
  searchParams?: Promise<{ error?: string }> | { error?: string };
};

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function fakeCoordinates(seed: string) {
  const hash = hashString(seed || "foodify");
  const lat = 6.4 + ((hash % 3000) / 10000);
  const lng = 3.2 + (((Math.floor(hash / 3000)) % 4000) / 10000);
  return {
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
  };
}

function pickAreaFromAddress(address: string) {
  const normalized = address.toLowerCase();
  const match = areaOptions.find((area) =>
    normalized.includes(area.toLowerCase())
  );
  return match ?? areaOptions[0];
}

export default async function RestaurantOnboardingPage({
  searchParams,
}: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const user = await getUserFromSession();
  if (!user) {
    redirect("/signup");
  }
  if (user.role !== Role.RESTAURANT) {
    redirect(`/onboarding/${user.role.toLowerCase()}`);
  }
  if (user.status === "EMAIL_UNVERIFIED") {
    redirect(`/signup/verify?email=${encodeURIComponent(user.email)}`);
  }

  const profile = await getRestaurantProfile(user.id);
  const errorMessage = resolvedSearchParams.error
    ? errorMessages[resolvedSearchParams.error]
    : null;

  if (user.status === "PENDING_APPROVAL" || user.status === "APPROVED") {
    redirect("/restaurant");
  }

  async function completeRestaurantProfile(formData: FormData) {
    "use server";
    const authedUser = await getUserFromSession();
    if (!authedUser) {
      redirect("/signup");
    }
    if (authedUser.role !== Role.RESTAURANT) {
      redirect(`/onboarding/${authedUser.role.toLowerCase()}`);
    }

    const restaurantName = String(formData.get("restaurantName") || "").trim();
    const phoneNumber = String(formData.get("phoneNumber") || "").trim();
    const streetAddress = String(formData.get("streetAddress") || "").trim();

    if (!restaurantName || !phoneNumber || !streetAddress) {
      redirect("/onboarding/restaurant?error=missing");
    }

    const matchedAreaLabel = pickAreaFromAddress(streetAddress);
    const mappedArea = areaLabelToEnum[matchedAreaLabel];
    const mappedPrepTime =
      prepTimeLabelToEnum[prepTimeOptions[1] as keyof typeof prepTimeLabelToEnum];
    const mappedBank = bankLabelToEnum[bankOptions[0]];
    const mappedCuisine = mapCuisineTypes(cuisineTypes.slice(0, 2));
    const mappedDays = mapDays(dayOptions);

    if (!mappedArea || !mappedPrepTime || !mappedBank || !mappedCuisine || !mappedDays) {
      redirect("/onboarding/restaurant?error=missing");
    }

    const { lat, lng } = fakeCoordinates(
      `${streetAddress}:${authedUser.email}`
    );

    const logoText = encodeURIComponent(restaurantName || "Foodify");
    const logoUrl = profile?.logoUrl ?? `https://placehold.co/256x256/png?text=${logoText}`;

    await upsertRestaurantProfile(authedUser.id, {
      restaurantName,
      logoUrl,
      phoneNumber,
      streetAddress,
      area: mappedArea,
      city: "Lagos",
      addressLat: lat,
      addressLng: lng,
      cuisineTypes: mappedCuisine,
      openTime: "09:00",
      closeTime: "21:00",
      daysOpen: mappedDays,
      prepTimeRange: mappedPrepTime,
      bankName: mappedBank,
      accountNumber: String(1000000000 + (hashString(restaurantName) % 9000000000)),
      accountName: restaurantName,
    });

    await updateUser(authedUser.id, { status: "PENDING_APPROVAL" });

    redirect("/onboarding/restaurant");
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Restaurant onboarding
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Launch your restaurant profile fast.
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Share your restaurant name and address. We will auto-fill the rest of
            the profile for the demo.
          </p>
        </header>

        {errorMessage ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <form action={completeRestaurantProfile} className="grid gap-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Restaurant details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="restaurantName">Restaurant name</Label>
                <Input
                  id="restaurantName"
                  name="restaurantName"
                  defaultValue={profile?.restaurantName ?? ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Restaurant phone number</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  defaultValue={profile?.phoneNumber ?? ""}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="streetAddress">Street address</Label>
                <Input
                  id="streetAddress"
                  name="streetAddress"
                  defaultValue={profile?.streetAddress ?? ""}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Submitting moves your profile to pending approval.
            </p>
            <Button type="submit" className="sm:w-auto">
              Submit for approval
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
