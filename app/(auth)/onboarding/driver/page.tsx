import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { areaOptions, bankOptions, vehicleTypes } from "@/app/lib/constants";
import { Role } from "@/app/generated/prisma/client";
import { getUserFromSession } from "@/app/lib/session";
import {
  bankLabelToEnum,
  mapAreas,
  vehicleLabelToEnum,
} from "@/app/lib/db";
import { updateUser, upsertDriverProfile } from "@/app/lib/db";
import { AppHeader } from "@/components/app/app-header";
import Link from "next/link";

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function fakeAccountNumber(seed: string) {
  const hash = hashString(seed || "foodify");
  const base = 1000000000 + (hash % 9000000000);
  return String(base).padStart(10, "0");
}

type PageProps = {
  searchParams?: Promise<{ error?: string }> | { error?: string };
};

export default async function DriverOnboardingPage({
  searchParams,
}: PageProps) {
  await searchParams;
  const user = await getUserFromSession();
  if (!user) {
    redirect("/signup");
  }
  if (user.role !== Role.DRIVER) {
    redirect(`/onboarding/${user.role.toLowerCase()}`);
  }
  if (user.status === "EMAIL_UNVERIFIED") {
    redirect(`/signup/verify?email=${encodeURIComponent(user.email)}`);
  }

  if (user.status === "PENDING_APPROVAL" || user.status === "APPROVED") {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-6 py-16">
          <Card className="w-full border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl">
                {user.status === "APPROVED"
                  ? "Driver approved"
                  : "Driver profile under review"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {user.status === "APPROVED"
                  ? "Your rider demo profile is live. Proceed to your dashboard."
                  : "Your profile is pending approval. We will notify you once reviewed."}
              </p>
            </CardHeader>
            {user.status === "APPROVED" ? (
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/driver">Open rider dashboard</Link>
                </Button>
              </CardContent>
            ) : null}
          </Card>
        </main>
      </div>
    );
  }

  async function completeDriverProfile() {
    "use server";
    const authedUser = await getUserFromSession();
    if (!authedUser) {
      redirect("/signup");
    }
    if (authedUser.role !== Role.DRIVER) {
      redirect(`/onboarding/${authedUser.role.toLowerCase()}`);
    }

    const seed = `${authedUser.id}:${authedUser.email}`;
    const vehicleLabel = vehicleTypes[0];
    const bankLabel = bankOptions[0];
    const serviceAreas =
      mapAreas(areaOptions.slice(0, 2)) ?? mapAreas(areaOptions.slice(0, 1));
    if (!serviceAreas) {
      redirect("/onboarding/driver");
    }

    await upsertDriverProfile(authedUser.id, {
      licenseNumber: `DRV-${authedUser.id.slice(0, 6).toUpperCase()}`,
      vehicleType: vehicleLabelToEnum[vehicleLabel],
      plateNumber: `FD-${authedUser.id.slice(0, 6).toUpperCase()}`,
      serviceAreas,
      bankName: bankLabelToEnum[bankLabel],
      accountNumber: fakeAccountNumber(seed),
      accountName: authedUser.fullName || "Foodify Rider",
    });

    await updateUser(authedUser.id, { status: "APPROVED" });

    redirect("/driver");
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-16">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Driver onboarding
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Activate your rider profile.
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            For this demo we auto-create your rider profile and skip manual
            verification fields like license validation.
          </p>
        </header>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Finish setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tap below to generate your rider profile with demo-safe data.
            </p>
            <form action={completeDriverProfile}>
              <Button type="submit" className="w-full">
                Activate rider profile
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
