import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { areaOptions, bankOptions, vehicleTypes } from "@/app/lib/constants";
import {
  areaEnumToLabel,
  bankEnumToLabel,
  bankLabelToEnum,
  mapAreas,
  updateUser,
  upsertDriverProfile,
  vehicleEnumToLabel,
  vehicleLabelToEnum,
} from "@/app/lib/db";
import { requireDriverAccess } from "@/app/driver/_lib/access";

const errorMessages: Record<string, string> = {
  missing: "Please fill all required fields.",
  invalidServiceAreas: "Select at least one valid service area.",
  invalidVehicleType: "Select a valid vehicle type.",
  invalidBank: "Select a valid bank.",
};

type PageProps = {
  searchParams?: Promise<{ status?: string; error?: string }> | { status?: string; error?: string };
};

export default async function DriverProfilePage({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const { user, profile } = await requireDriverAccess();

  const statusMessage =
    resolvedSearchParams.status === "updated" ? "Profile updated successfully." : null;
  const errorMessage = resolvedSearchParams.error
    ? errorMessages[resolvedSearchParams.error]
    : null;

  async function updateDriverProfile(formData: FormData) {
    "use server";

    const access = await requireDriverAccess();
    const fullName = String(formData.get("fullName") || "").trim();
    const licenseNumber = String(formData.get("licenseNumber") || "").trim();
    const plateNumber = String(formData.get("plateNumber") || "").trim();
    const accountNumber = String(formData.get("accountNumber") || "").trim();
    const accountName = String(formData.get("accountName") || "").trim();
    const vehicleLabel = String(formData.get("vehicleType") || "").trim();
    const bankLabel = String(formData.get("bankName") || "").trim();
    const selectedServiceAreas = formData
      .getAll("serviceAreas")
      .map((value) => String(value).trim())
      .filter(Boolean);

    if (
      !fullName ||
      !licenseNumber ||
      !plateNumber ||
      !accountNumber ||
      !accountName ||
      !vehicleLabel ||
      !bankLabel
    ) {
      redirect("/driver/profile?error=missing");
    }

    const mappedServiceAreas = mapAreas(selectedServiceAreas);
    if (!mappedServiceAreas || mappedServiceAreas.length === 0) {
      redirect("/driver/profile?error=invalidServiceAreas");
    }

    const mappedVehicle =
      vehicleLabelToEnum[vehicleLabel as keyof typeof vehicleLabelToEnum];
    if (!mappedVehicle) {
      redirect("/driver/profile?error=invalidVehicleType");
    }

    const mappedBank = bankLabelToEnum[bankLabel as keyof typeof bankLabelToEnum];
    if (!mappedBank) {
      redirect("/driver/profile?error=invalidBank");
    }

    await upsertDriverProfile(access.user.id, {
      licenseNumber,
      vehicleType: mappedVehicle,
      plateNumber,
      serviceAreas: mappedServiceAreas,
      bankName: mappedBank,
      accountNumber,
      accountName,
    });

    if (fullName !== access.user.fullName) {
      await updateUser(access.user.id, { fullName });
    }

    redirect("/driver/profile?status=updated");
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Rider Profile
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Manage profile details
          </h1>
          <p className="text-sm text-muted-foreground">
            Update service areas, rider identity, and payout account information.
          </p>
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

        <form action={updateDriverProfile} className="grid gap-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Identity</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" name="fullName" defaultValue={user.fullName} required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user.email} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">License number</Label>
                <Input
                  id="licenseNumber"
                  name="licenseNumber"
                  defaultValue={profile.licenseNumber}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plateNumber">Plate number</Label>
                <Input id="plateNumber" name="plateNumber" defaultValue={profile.plateNumber} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleType">Vehicle type</Label>
                <select
                  id="vehicleType"
                  name="vehicleType"
                  defaultValue={vehicleEnumToLabel[profile.vehicleType]}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  required
                >
                  {vehicleTypes.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Service Areas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {areaOptions.map((area) => {
                const checked = profile.serviceAreas.some(
                  (serviceArea) => areaEnumToLabel[serviceArea] === area
                );
                const checkboxId = `service-area-${area.replace(/\s+/g, "-").toLowerCase()}`;
                return (
                  <label
                    key={area}
                    htmlFor={checkboxId}
                    className="flex cursor-pointer items-center gap-3 rounded-md border border-border/70 px-3 py-2 text-sm"
                  >
                    <input
                      id={checkboxId}
                      type="checkbox"
                      name="serviceAreas"
                      value={area}
                      defaultChecked={checked}
                      className="h-4 w-4 rounded border border-border"
                    />
                    <span>{area}</span>
                  </label>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Payout Account</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="bankName">Bank name</Label>
                <select
                  id="bankName"
                  name="bankName"
                  defaultValue={bankEnumToLabel[profile.bankName]}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  required
                >
                  {bankOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account number</Label>
                <Input
                  id="accountNumber"
                  name="accountNumber"
                  defaultValue={profile.accountNumber}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountName">Account name</Label>
                <Input id="accountName" name="accountName" defaultValue={profile.accountName} required />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit">Save profile</Button>
          </div>
        </form>
      </main>
    </div>
  );
}
