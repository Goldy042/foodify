import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Role } from "@/app/generated/prisma/client";
import { getUserFromSession } from "@/app/lib/session";
import { updateUser, upsertCustomerProfile } from "@/app/lib/db";

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

type PageProps = {
  searchParams?: Promise<{ error?: string }> | { error?: string };
};

export default async function CustomerOnboardingPage({
  searchParams,
}: PageProps) {
  await searchParams;
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

  async function completeCustomerProfile() {
    "use server";
    const authedUser = await getUserFromSession();
    if (!authedUser) {
      redirect("/signup");
    }
    if (authedUser.role !== Role.CUSTOMER) {
      redirect(`/onboarding/${authedUser.role.toLowerCase()}`);
    }

    const seed = `${authedUser.id}:${authedUser.email}`;
    const { lat, lng } = fakeCoordinates(seed);

    await upsertCustomerProfile(authedUser.id, {
      defaultAddressText: "Dynamic location (set per order)",
      defaultAddressLat: lat,
      defaultAddressLng: lng,
      deliveryInstructions: null,
    });

    await updateUser(authedUser.id, { status: "PROFILE_COMPLETED" });

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
            We keep your location flexible, so you can set delivery details per
            order. No extra setup needed.
          </p>
        </header>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Finish setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tap below to activate your profile. You can update delivery notes
              anytime in your orders.
            </p>
            <form action={completeCustomerProfile}>
              <Button type="submit" className="w-full">
                Activate customer profile
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
