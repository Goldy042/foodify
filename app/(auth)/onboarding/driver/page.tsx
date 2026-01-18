import { redirect } from "next/navigation";

import { MultiCheckboxGroup } from "@/components/forms/multi-checkbox-group";
import { SelectField } from "@/components/forms/select-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { areaOptions, bankOptions, vehicleTypes } from "@/app/lib/constants";
import { Role } from "@/app/generated/prisma/client";
import { getUserFromSession } from "@/app/lib/session";
import {
  areaEnumToLabel,
  bankEnumToLabel,
  bankLabelToEnum,
  mapAreas,
  vehicleEnumToLabel,
  vehicleLabelToEnum,
} from "@/app/lib/db";
import {
  getDriverProfile,
  updateUser,
  upsertDriverProfile,
} from "@/app/lib/db";

const errorMessages: Record<string, string> = {
  missing: "Please fill in all required fields.",
  "invalid-vehicle": "Select a valid vehicle type.",
  "invalid-bank": "Select a valid bank.",
  "missing-areas": "Select at least one service area.",
};

type PageProps = {
  searchParams?: Promise<{ error?: string }> | { error?: string };
};

export default async function DriverOnboardingPage({
  searchParams,
}: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
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

  const profile = await getDriverProfile(user.id);
  const errorMessage = resolvedSearchParams.error
    ? errorMessages[resolvedSearchParams.error]
    : null;

  if (user.status === "PENDING_APPROVAL" || user.status === "APPROVED") {
    return (
      <div className="min-h-screen bg-background">
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
                  ? "You can now go online and accept assignments."
                  : "Your profile is pending approval. We will notify you once reviewed."}
              </p>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  async function completeDriverProfile(formData: FormData) {
    "use server";
    const authedUser = await getUserFromSession();
    if (!authedUser) {
      redirect("/signup");
    }
    if (authedUser.role !== Role.DRIVER) {
      redirect(`/onboarding/${authedUser.role.toLowerCase()}`);
    }

    const fullName = String(formData.get("fullName") || "").trim();
    const licenseNumber = String(formData.get("licenseNumber") || "").trim();
    const vehicleType = String(formData.get("vehicleType") || "").trim();
    const plateNumber = String(formData.get("plateNumber") || "").trim();
    const serviceAreas = formData.getAll("serviceAreas").map(String);
    const bankName = String(formData.get("bankName") || "").trim();
    const accountNumber = String(formData.get("accountNumber") || "").trim();
    const accountName = String(formData.get("accountName") || "").trim();

    if (
      !fullName ||
      !licenseNumber ||
      !vehicleType ||
      !plateNumber ||
      !bankName ||
      !accountNumber ||
      !accountName
    ) {
      redirect("/onboarding/driver?error=missing");
    }

    if (!vehicleTypes.includes(vehicleType)) {
      redirect("/onboarding/driver?error=invalid-vehicle");
    }
    if (!bankOptions.includes(bankName)) {
      redirect("/onboarding/driver?error=invalid-bank");
    }
    if (serviceAreas.length === 0) {
      redirect("/onboarding/driver?error=missing-areas");
    }

    const mappedVehicle =
      vehicleLabelToEnum[vehicleType as keyof typeof vehicleLabelToEnum];
    const mappedBank = bankLabelToEnum[bankName as keyof typeof bankLabelToEnum];
    const mappedAreas = mapAreas(serviceAreas);

    if (!mappedVehicle || !mappedBank || !mappedAreas) {
      redirect("/onboarding/driver?error=missing");
    }

    await upsertDriverProfile(authedUser.id, {
      licenseNumber,
      vehicleType: mappedVehicle,
      plateNumber,
      serviceAreas: mappedAreas,
      bankName: mappedBank,
      accountNumber,
      accountName,
    });

    await updateUser(authedUser.id, {
      fullName,
      status: "PENDING_APPROVAL",
    });

    redirect("/onboarding/driver");
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Driver onboarding
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Complete your driver profile
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Provide your license, vehicle, service areas, and payout details.
            Approval is required before you can go online.
          </p>
        </header>

        {errorMessage ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <form action={completeDriverProfile} className="grid gap-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Driver identity</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
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
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">Driver license number</Label>
                <Input
                  id="licenseNumber"
                  name="licenseNumber"
                  defaultValue={profile?.licenseNumber ?? ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plateNumber">Plate number</Label>
                <Input
                  id="plateNumber"
                  name="plateNumber"
                  defaultValue={profile?.plateNumber ?? ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Vehicle type</Label>
                <SelectField
                  name="vehicleType"
                  options={vehicleTypes}
                  placeholder="Select vehicle type"
                  defaultValue={
                    profile?.vehicleType
                      ? vehicleEnumToLabel[profile.vehicleType]
                      : undefined
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Service areas</CardTitle>
            </CardHeader>
            <CardContent>
              <MultiCheckboxGroup
                name="serviceAreas"
                options={areaOptions}
                defaultValues={
                  profile?.serviceAreas?.map((area) => areaEnumToLabel[area]) ??
                  []
                }
                columns={3}
              />
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
                  defaultValue={
                    profile?.bankName ? bankEnumToLabel[profile.bankName] : undefined
                  }
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
