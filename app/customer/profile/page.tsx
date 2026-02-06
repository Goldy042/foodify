import { redirect } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getUserFromSession } from "@/app/lib/session";
import { Role } from "@/app/generated/prisma/client";
import { getCustomerProfile } from "@/app/lib/db";
import { updateCustomerProfile } from "@/app/lib/profile-actions";
import { AppHeader } from "@/components/app/app-header";

const errorMessages: Record<string, string> = {
  missing: "Please fill in all required fields.",
  invalidCoords: "Enter valid latitude and longitude values.",
};

type PageProps = {
  searchParams?: Promise<{ error?: string; status?: string }> | {
    error?: string;
    status?: string;
  };
};

export default async function CustomerProfilePage({ searchParams }: PageProps) {
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

  const errorMessage = resolvedSearchParams.error
    ? errorMessages[resolvedSearchParams.error]
    : null;
  const statusMessage =
    resolvedSearchParams.status === "updated"
      ? "Profile updated successfully."
      : null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 pb-20 pt-10">
        <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-primary/90 via-amber-400/80 to-amber-200/80 p-8 text-primary-foreground shadow-sm">
          <div className="pointer-events-none absolute -right-10 -top-16 h-36 w-36 rounded-full bg-white/20 blur-3xl" />
          <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-primary-foreground/80">
                Profile
              </p>
              <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                Update your delivery details.
              </h1>
              <p className="text-sm text-primary-foreground/85">
                Keep your address and delivery notes up to date for smoother handoffs.
              </p>
            </div>
            <Button asChild variant="secondary" className="bg-white/90">
              <Link href="/customer">Back to dashboard</Link>
            </Button>
          </div>
        </section>

        {errorMessage ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        {statusMessage ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {statusMessage}
          </div>
        ) : null}

        <form action={updateCustomerProfile} className="grid gap-6">
          <Card className="border-border/60 bg-card/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Customer details</CardTitle>
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
                  defaultValue={profile.defaultAddressText}
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
                  defaultValue={profile.defaultAddressLat.toString()}
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
                  defaultValue={profile.defaultAddressLng.toString()}
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
                  defaultValue={profile.deliveryInstructions ?? ""}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Changes take effect immediately for new orders.
            </p>
            <Button type="submit" className="sm:w-auto">
              Save changes
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
