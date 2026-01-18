import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Role } from "@/app/generated/prisma/client";
import { getUserFromSession } from "@/app/lib/session";
import {
  getCustomerProfile,
  updateUser,
  upsertCustomerProfile,
} from "@/app/lib/db";

const errorMessages: Record<string, string> = {
  missing: "Please fill in all required fields.",
  "invalid-coordinates": "Latitude and longitude must be valid numbers.",
};

type PageProps = {
  searchParams?: Promise<{ error?: string }> | { error?: string };
};

export default async function CustomerOnboardingPage({
  searchParams,
}: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const user = await getUserFromSession();
  if (!user) {
    redirect("/signup");
  }
  if (user.role !== Role.CUSTOMER) {
    redirect(`/onboarding/${user.role.toLowerCase()}`);
  }
  if (user.status === "EMAIL_UNVERIFIED") {
    redirect(`/signup/verify?email=${encodeURIComponent(user.email)}`);
  }

  const profile = await getCustomerProfile(user.id);
  const errorMessage = resolvedSearchParams.error
    ? errorMessages[resolvedSearchParams.error]
    : null;

  if (user.status === "PROFILE_COMPLETED") {
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-6 py-16">
          <Card className="w-full border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl">Profile completed</CardTitle>
              <p className="text-sm text-muted-foreground">
                Your customer profile is active. You can start ordering once the
                customer dashboard is live.
              </p>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  async function completeCustomerProfile(formData: FormData) {
    "use server";
    const authedUser = await getUserFromSession();
    if (!authedUser) {
      redirect("/signup");
    }
    if (authedUser.role !== Role.CUSTOMER) {
      redirect(`/onboarding/${authedUser.role.toLowerCase()}`);
    }

    const fullName = String(formData.get("fullName") || "").trim();
    const address = String(formData.get("address") || "").trim();
    const latRaw = String(formData.get("lat") || "").trim();
    const lngRaw = String(formData.get("lng") || "").trim();
    const instructions = String(formData.get("instructions") || "").trim();

    if (!fullName || !address || !latRaw || !lngRaw) {
      redirect("/onboarding/customer?error=missing");
    }

    const lat = Number(latRaw);
    const lng = Number(lngRaw);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      redirect("/onboarding/customer?error=invalid-coordinates");
    }

    await updateUser(authedUser.id, { fullName, status: "PROFILE_COMPLETED" });
    await upsertCustomerProfile(authedUser.id, {
      defaultAddressText: address,
      defaultAddressLat: lat,
      defaultAddressLng: lng,
      deliveryInstructions: instructions || null,
    });

    redirect("/onboarding/customer");
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-16">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Customer onboarding
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Complete your customer profile
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Set your default delivery address and map pin. Your account becomes
            active immediately after completion.
          </p>
        </header>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Profile details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {errorMessage ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : null}
            <form action={completeCustomerProfile} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    defaultValue={user.fullName}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user.email} readOnly />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Default delivery address</Label>
                <Input
                  id="address"
                  name="address"
                  defaultValue={profile?.defaultAddressText ?? ""}
                  placeholder="Enter delivery address"
                  required
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="lat">Map pin latitude</Label>
                  <Input
                    id="lat"
                    name="lat"
                    type="number"
                    step="0.000001"
                    defaultValue={
                      profile?.defaultAddressLat !== undefined
                        ? Number(profile.defaultAddressLat)
                        : ""
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
                      profile?.defaultAddressLng !== undefined
                        ? Number(profile.defaultAddressLng)
                        : ""
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="instructions">Delivery instructions (optional)</Label>
                <Textarea
                  id="instructions"
                  name="instructions"
                  defaultValue={profile?.deliveryInstructions ?? ""}
                  placeholder="Extra notes for drivers"
                />
              </div>
              <Button type="submit" className="w-full">
                Save customer profile
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
