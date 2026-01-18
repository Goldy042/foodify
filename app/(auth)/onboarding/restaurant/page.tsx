import { redirect } from "next/navigation";

import { MultiCheckboxGroup } from "@/components/forms/multi-checkbox-group";
import { SelectField } from "@/components/forms/select-field";
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
import { getUserFromSession } from "@/app/lib/session";
import {
  getRestaurantProfile,
  updateUser,
  upsertRestaurantProfile,
} from "@/app/lib/store";

const errorMessages: Record<string, string> = {
  missing: "Please fill in all required fields.",
  "invalid-area": "Select a valid area from the list.",
  "invalid-prep": "Select a valid preparation time.",
  "invalid-bank": "Select a valid bank.",
  "invalid-coordinates": "Latitude and longitude must be valid numbers.",
  "missing-cuisine": "Select at least one cuisine type.",
  "missing-days": "Select at least one day of operation.",
};

export default async function RestaurantOnboardingPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const user = await getUserFromSession();
  if (!user) {
    redirect("/signup");
  }
  if (user.role !== "Restaurant") {
    redirect(`/onboarding/${user.role.toLowerCase()}`);
  }
  if (user.status === "EMAIL_UNVERIFIED") {
    redirect(`/signup/verify?email=${encodeURIComponent(user.email)}`);
  }

  const profile = await getRestaurantProfile(user.id);
  const errorMessage = searchParams?.error
    ? errorMessages[searchParams.error]
    : null;

  if (user.status === "PENDING_APPROVAL" || user.status === "APPROVED") {
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-6 py-16">
          <Card className="w-full border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl">
                {user.status === "APPROVED"
                  ? "Restaurant approved"
                  : "Restaurant under review"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {user.status === "APPROVED"
                  ? "Your restaurant is live and visible to customers."
                  : "Your profile is pending admin approval. We will notify you once reviewed."}
              </p>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  async function completeRestaurantProfile(formData: FormData) {
    "use server";
    const authedUser = await getUserFromSession();
    if (!authedUser) {
      redirect("/signup");
    }
    if (authedUser.role !== "Restaurant") {
      redirect(`/onboarding/${authedUser.role.toLowerCase()}`);
    }

    const restaurantName = String(formData.get("restaurantName") || "").trim();
    const logoUrl = String(formData.get("logoUrl") || "").trim();
    const phoneNumber = String(formData.get("phoneNumber") || "").trim();
    const streetAddress = String(formData.get("streetAddress") || "").trim();
    const area = String(formData.get("area") || "").trim();
    const city = String(formData.get("city") || "Lagos").trim();
    const latRaw = String(formData.get("lat") || "").trim();
    const lngRaw = String(formData.get("lng") || "").trim();
    const cuisineSelections = formData.getAll("cuisineTypes").map(String);
    const openTime = String(formData.get("openTime") || "").trim();
    const closeTime = String(formData.get("closeTime") || "").trim();
    const daysSelections = formData.getAll("daysOpen").map(String);
    const prepTimeRange = String(formData.get("prepTimeRange") || "").trim();
    const bankName = String(formData.get("bankName") || "").trim();
    const accountNumber = String(formData.get("accountNumber") || "").trim();
    const accountName = String(formData.get("accountName") || "").trim();

    if (
      !restaurantName ||
      !logoUrl ||
      !phoneNumber ||
      !streetAddress ||
      !area ||
      !latRaw ||
      !lngRaw ||
      !openTime ||
      !closeTime ||
      !prepTimeRange ||
      !bankName ||
      !accountNumber ||
      !accountName
    ) {
      redirect("/onboarding/restaurant?error=missing");
    }

    if (!areaOptions.includes(area)) {
      redirect("/onboarding/restaurant?error=invalid-area");
    }
    if (!prepTimeOptions.includes(prepTimeRange)) {
      redirect("/onboarding/restaurant?error=invalid-prep");
    }
    if (!bankOptions.includes(bankName)) {
      redirect("/onboarding/restaurant?error=invalid-bank");
    }
    if (cuisineSelections.length === 0) {
      redirect("/onboarding/restaurant?error=missing-cuisine");
    }
    if (daysSelections.length === 0) {
      redirect("/onboarding/restaurant?error=missing-days");
    }

    const lat = Number(latRaw);
    const lng = Number(lngRaw);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      redirect("/onboarding/restaurant?error=invalid-coordinates");
    }

    await upsertRestaurantProfile(authedUser.id, {
      restaurantName,
      logoUrl,
      phoneNumber,
      streetAddress,
      area,
      city: city || "Lagos",
      addressLat: lat,
      addressLng: lng,
      cuisineTypes: cuisineSelections,
      openTime,
      closeTime,
      daysOpen: daysSelections,
      prepTimeRange,
      bankName,
      accountNumber,
      accountName,
    });

    await updateUser(authedUser.id, { status: "PENDING_APPROVAL" });

    redirect("/onboarding/restaurant");
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Restaurant onboarding
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Complete your restaurant profile
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Provide verified business, location, and payout details. Your
            restaurant goes live only after admin approval.
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
              <CardTitle className="text-xl">Restaurant identity</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="restaurantName">Restaurant name</Label>
                <Input
                  id="restaurantName"
                  name="restaurantName"
                  defaultValue={profile?.restaurantName ?? ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Restaurant logo (image URL)</Label>
                <Input
                  id="logoUrl"
                  name="logoUrl"
                  type="url"
                  defaultValue={profile?.logoUrl ?? ""}
                  placeholder="https://"
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
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Location</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="streetAddress">Street address</Label>
                <Input
                  id="streetAddress"
                  name="streetAddress"
                  defaultValue={profile?.streetAddress ?? ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Area / Neighborhood</Label>
                <SelectField
                  name="area"
                  options={areaOptions}
                  placeholder="Select area"
                  defaultValue={profile?.area}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" value="Lagos" readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lat">Map pin latitude</Label>
                <Input
                  id="lat"
                  name="lat"
                  type="number"
                  step="0.000001"
                  defaultValue={
                    profile?.addressLat !== undefined ? profile.addressLat : ""
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lng">Map pin longitude</Label>
                <Input
                  id="lng"
                  name="lng"
                  type="number"
                  step="0.000001"
                  defaultValue={
                    profile?.addressLng !== undefined ? profile.addressLng : ""
                  }
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Cuisine types</CardTitle>
            </CardHeader>
            <CardContent>
              <MultiCheckboxGroup
                name="cuisineTypes"
                options={cuisineTypes}
                defaultValues={profile?.cuisineTypes ?? []}
                columns={3}
              />
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Operating hours</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="openTime">Open time (HH:MM)</Label>
                <Input
                  id="openTime"
                  name="openTime"
                  type="time"
                  defaultValue={profile?.openTime ?? ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closeTime">Close time (HH:MM)</Label>
                <Input
                  id="closeTime"
                  name="closeTime"
                  type="time"
                  defaultValue={profile?.closeTime ?? ""}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Days open</Label>
                <MultiCheckboxGroup
                  name="daysOpen"
                  options={dayOptions}
                  defaultValues={profile?.daysOpen ?? []}
                  columns={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Preparation time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Preparation time (select)</Label>
                <SelectField
                  name="prepTimeRange"
                  options={prepTimeOptions}
                  placeholder="Select prep time"
                  defaultValue={profile?.prepTimeRange}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Payout details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Bank name</Label>
                <SelectField
                  name="bankName"
                  options={bankOptions}
                  placeholder="Select bank"
                  defaultValue={profile?.bankName}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account number</Label>
                <Input
                  id="accountNumber"
                  name="accountNumber"
                  defaultValue={profile?.accountNumber ?? ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountName">
                  Account name (auto-resolved via API)
                </Label>
                <Input
                  id="accountName"
                  name="accountName"
                  defaultValue={profile?.accountName ?? ""}
                  placeholder="Account name"
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
