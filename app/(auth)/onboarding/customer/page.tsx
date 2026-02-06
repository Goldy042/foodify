import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Role } from "@/app/generated/prisma/client";
import { getUserFromSession } from "@/app/lib/session";
import { getCustomerProfile, updateUser, upsertCustomerProfile } from "@/app/lib/db";
import Link from "next/link";

const errorMessages: Record<string, string> = {
  missing: "Please fill in all required fields.",
  invalidCoords: "Enter valid latitude and longitude values.",
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
                Your customer profile is active. Start browsing approved
                restaurants.
              </p>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/customer">Go to customer dashboard</Link>
              </Button>
            </CardContent>
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
    const addressText = String(formData.get("defaultAddressText") || "").trim();
    const latInput = String(formData.get("defaultAddressLat") || "").trim();
    const lngInput = String(formData.get("defaultAddressLng") || "").trim();
    const deliveryInstructions = String(
      formData.get("deliveryInstructions") || ""
    ).trim();

    if (!fullName || !addressText || !latInput || !lngInput) {
      redirect("/onboarding/customer?error=missing");
    }

    const lat = Number(latInput);
    const lng = Number(lngInput);
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      Math.abs(lat) > 90 ||
      Math.abs(lng) > 180
    ) {
      redirect("/onboarding/customer?error=invalidCoords");
    }

    await upsertCustomerProfile(authedUser.id, {
      defaultAddressText: addressText,
      defaultAddressLat: lat,
      defaultAddressLng: lng,
      deliveryInstructions: deliveryInstructions ? deliveryInstructions : null,
    });

    const updates: { fullName?: string; status: "PROFILE_COMPLETED" } = {
      status: "PROFILE_COMPLETED",
    };
    if (fullName !== authedUser.fullName) {
      updates.fullName = fullName;
    }
    await updateUser(authedUser.id, updates);

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
            You are almost ready to order.
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Add your default delivery address so orders can be routed quickly.
            You can update this any time from your profile.
          </p>
        </header>

        {errorMessage ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <form action={completeCustomerProfile} className="grid gap-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Profile details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  defaultValue={user.fullName}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user.email} readOnly />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="defaultAddressText">
                  Default delivery address
                </Label>
                <Input
                  id="defaultAddressText"
                  name="defaultAddressText"
                  defaultValue={profile?.defaultAddressText ?? ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultAddressLat">Map pin latitude</Label>
                <Input
                  id="defaultAddressLat"
                  name="defaultAddressLat"
                  type="number"
                  step="0.000001"
                  defaultValue={profile?.defaultAddressLat?.toString() ?? ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultAddressLng">Map pin longitude</Label>
                <Input
                  id="defaultAddressLng"
                  name="defaultAddressLng"
                  type="number"
                  step="0.000001"
                  defaultValue={profile?.defaultAddressLng?.toString() ?? ""}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="deliveryInstructions">
                  Delivery instructions (optional)
                </Label>
                <Textarea
                  id="deliveryInstructions"
                  name="deliveryInstructions"
                  rows={3}
                  defaultValue={profile?.deliveryInstructions ?? ""}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Submitting activates your customer profile immediately.
            </p>
            <Button type="submit" className="sm:w-auto">
              Activate customer profile
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
