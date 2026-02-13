import Link from "next/link";
import { redirect } from "next/navigation";
import { Prisma, Role } from "@/app/generated/prisma/client";

import prisma from "@/lib/prisma";
import { AppHeader } from "@/components/app/app-header";
import { MultiCheckboxGroup } from "@/components/forms/multi-checkbox-group";
import { MenuModifierBuilder } from "@/components/forms/menu-modifier-builder";
import { SelectField } from "@/components/forms/select-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  areaOptions,
  cuisineTypes,
  dayOptions,
  measurementUnits,
  menuCategories,
  prepTimeOptions,
  restaurantStaffRoleOptions,
} from "@/app/lib/constants";
import {
  areaEnumToLabel,
  areaLabelToEnum,
  cuisineEnumToLabel,
  dayEnumToLabel,
  mapCuisineTypes,
  mapDays,
  measurementEnumToLabel,
  measurementLabelToEnum,
  menuCategoryEnumToLabel,
  menuCategoryLabelToEnum,
  prepTimeEnumToLabel,
  prepTimeLabelToEnum,
  restaurantStaffRoleEnumToLabel,
  restaurantStaffRoleLabelToEnum,
  restaurantStaffStatusEnumToLabel,
} from "@/app/lib/db";
import { formatCurrency } from "@/app/lib/pricing";
import { getUserFromSession } from "@/app/lib/session";

const statusMessages: Record<string, string> = {
  "settings-saved": "Restaurant settings were updated.",
  "menu-item-added": "Menu item was added successfully.",
  "staff-invited": "Staff member was invited.",
};

const errorMessages: Record<string, string> = {
  "invalid-settings": "Provide valid settings values before saving.",
  "invalid-menu": "Provide valid menu item details before adding.",
  "invalid-modifier-config":
    "Modifier JSON is invalid. Check group fields, option limits, and quantities.",
  "invalid-staff": "Provide valid staff details before inviting.",
  "staff-unavailable":
    "Staff tools are temporarily unavailable. Apply latest migrations and refresh.",
};

type PageProps = {
  searchParams?: Promise<{ status?: string; error?: string }> | {
    status?: string;
    error?: string;
  };
};

function isValidTimeInput(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function buildBaseImageUrl(name: string) {
  const text = encodeURIComponent(name || "Foodify");
  return `https://placehold.co/640x420/png?text=${text}`;
}

type ParsedModifierGroupConfig = {
  name: string;
  isRequired: boolean;
  maxSelections: number;
  options: Array<{
    name: string;
    priceDelta: Prisma.Decimal;
    maxQuantity: number;
    includedQuantity: number;
    defaultQuantity: number;
  }>;
};

function parseModifierGroupsConfig(
  input: string
): ParsedModifierGroupConfig[] | null {
  if (!input.trim()) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    return null;
  }

  if (!Array.isArray(parsed)) {
    return null;
  }

  const groups: ParsedModifierGroupConfig[] = [];

  for (const rawGroup of parsed) {
    if (!rawGroup || typeof rawGroup !== "object") {
      return null;
    }

    const group = rawGroup as {
      name?: unknown;
      isRequired?: unknown;
      maxSelections?: unknown;
      options?: unknown;
    };

    const name = String(group.name ?? "").trim();
    const isRequired = Boolean(group.isRequired);
    const maxSelections = Number(group.maxSelections);

    if (
      !name ||
      !Number.isFinite(maxSelections) ||
      maxSelections < 1 ||
      !Number.isInteger(maxSelections) ||
      !Array.isArray(group.options) ||
      group.options.length === 0
    ) {
      return null;
    }

    const options = group.options.map((rawOption) => {
      if (!rawOption || typeof rawOption !== "object") {
        return null;
      }

      const option = rawOption as {
        name?: unknown;
        priceDelta?: unknown;
        maxQuantity?: unknown;
        includedQuantity?: unknown;
        defaultQuantity?: unknown;
      };

      const optionName = String(option.name ?? "").trim();
      const priceDelta = Number(option.priceDelta ?? 0);
      const maxQuantity = Number(option.maxQuantity ?? 1);
      const includedQuantity = Number(option.includedQuantity ?? 0);
      const defaultQuantity = Number(option.defaultQuantity ?? 0);

      if (
        !optionName ||
        !Number.isFinite(priceDelta) ||
        priceDelta < 0 ||
        !Number.isFinite(maxQuantity) ||
        !Number.isInteger(maxQuantity) ||
        maxQuantity < 1 ||
        !Number.isFinite(includedQuantity) ||
        !Number.isInteger(includedQuantity) ||
        includedQuantity < 0 ||
        includedQuantity > maxQuantity ||
        !Number.isFinite(defaultQuantity) ||
        !Number.isInteger(defaultQuantity) ||
        defaultQuantity < 0 ||
        defaultQuantity > maxQuantity
      ) {
        return null;
      }

      return {
        name: optionName,
        priceDelta: new Prisma.Decimal(priceDelta.toFixed(2)),
        maxQuantity,
        includedQuantity,
        defaultQuantity,
      };
    });

    if (options.some((entry) => entry === null)) {
      return null;
    }

    const selectedDefaults = options.filter(
      (entry) => (entry as NonNullable<typeof entry>).defaultQuantity > 0
    ).length;
    if (selectedDefaults > maxSelections) {
      return null;
    }

    groups.push({
      name,
      isRequired,
      maxSelections,
      options: options as NonNullable<(typeof options)[number]>[],
    });
  }

  return groups;
}

async function getRestaurantWorkspace(userId: string) {
  const profile = await prisma.restaurantProfile.findUnique({
    where: { userId },
    include: {
      menuCategories: {
        orderBy: { createdAt: "asc" },
        include: {
          items: {
            orderBy: { createdAt: "desc" },
            include: {
              measurements: {
                orderBy: { createdAt: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!profile) {
    return null;
  }

  type StaffMemberList = Awaited<
    ReturnType<typeof prisma.restaurantStaffMember.findMany>
  >;

  const staffDelegate = (
    prisma as unknown as {
      restaurantStaffMember?: {
        findMany: typeof prisma.restaurantStaffMember.findMany;
      };
    }
  ).restaurantStaffMember;

  let staffMembers: StaffMemberList = [];
  if (staffDelegate?.findMany) {
    try {
      staffMembers = await staffDelegate.findMany({
        where: { restaurantId: profile.id },
        orderBy: { invitedAt: "desc" },
      });
    } catch {
      staffMembers = [];
    }
  }

  return {
    ...profile,
    staffMembers,
  };
}

export default async function RestaurantWorkspacePage({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const user = await getUserFromSession();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== Role.RESTAURANT) {
    redirect(`/onboarding/${user.role.toLowerCase()}`);
  }
  if (user.status === "EMAIL_UNVERIFIED") {
    redirect(`/signup/verify?email=${encodeURIComponent(user.email)}`);
  }
  if (user.status === "EMAIL_VERIFIED" || user.status === "REJECTED") {
    redirect("/onboarding/restaurant");
  }

  const workspace = await getRestaurantWorkspace(user.id);
  if (!workspace) {
    redirect("/onboarding/restaurant");
  }

  async function saveRestaurantSettings(formData: FormData) {
    "use server";

    const authedUser = await getUserFromSession();
    if (!authedUser || authedUser.role !== Role.RESTAURANT) {
      redirect("/login");
    }
    if (authedUser.status === "EMAIL_UNVERIFIED") {
      redirect(`/signup/verify?email=${encodeURIComponent(authedUser.email)}`);
    }

    const restaurantName = String(formData.get("restaurantName") || "").trim();
    const phoneNumber = String(formData.get("phoneNumber") || "").trim();
    const streetAddress = String(formData.get("streetAddress") || "").trim();
    const areaLabel = String(formData.get("area") || "").trim();
    const openTime = String(formData.get("openTime") || "").trim();
    const closeTime = String(formData.get("closeTime") || "").trim();
    const prepTimeLabel = String(formData.get("prepTime") || "").trim();
    const selectedDayLabels = formData
      .getAll("days")
      .map((value) => String(value));
    const selectedCuisineLabels = formData
      .getAll("cuisine")
      .map((value) => String(value));

    const area = areaLabelToEnum[areaLabel as keyof typeof areaLabelToEnum];
    const prepTime =
      prepTimeLabelToEnum[prepTimeLabel as keyof typeof prepTimeLabelToEnum];
    const daysOpen = mapDays(selectedDayLabels);
    const mappedCuisineTypes = mapCuisineTypes(selectedCuisineLabels);

    if (
      !restaurantName ||
      !phoneNumber ||
      !streetAddress ||
      !area ||
      !prepTime ||
      !isValidTimeInput(openTime) ||
      !isValidTimeInput(closeTime) ||
      !daysOpen ||
      daysOpen.length === 0 ||
      !mappedCuisineTypes ||
      mappedCuisineTypes.length === 0
    ) {
      redirect("/restaurant?error=invalid-settings");
    }

    await prisma.restaurantProfile.update({
      where: { userId: authedUser.id },
      data: {
        restaurantName,
        phoneNumber,
        streetAddress,
        area,
        openTime,
        closeTime,
        prepTimeRange: prepTime,
        daysOpen,
        cuisineTypes: mappedCuisineTypes,
      },
    });

    redirect("/restaurant?status=settings-saved");
  }

  async function addMenuItem(formData: FormData) {
    "use server";

    const authedUser = await getUserFromSession();
    if (!authedUser || authedUser.role !== Role.RESTAURANT) {
      redirect("/login");
    }
    if (authedUser.status === "EMAIL_UNVERIFIED") {
      redirect(`/signup/verify?email=${encodeURIComponent(authedUser.email)}`);
    }

    const itemName = String(formData.get("itemName") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const categoryLabel = String(formData.get("category") || "").trim();
    const measurementLabel = String(formData.get("measurementUnit") || "").trim();
    const basePriceInput = String(formData.get("basePrice") || "").trim();
    const modifiersJson = String(formData.get("modifiersJson") || "").trim();
    const isAvailable = String(formData.get("isAvailable") || "") === "on";

    const category =
      menuCategoryLabelToEnum[categoryLabel as keyof typeof menuCategoryLabelToEnum];
    const measurementUnit =
      measurementLabelToEnum[
        measurementLabel as keyof typeof measurementLabelToEnum
      ];
    const basePrice = Number(basePriceInput);
    const modifierGroupsConfig = parseModifierGroupsConfig(modifiersJson);

    if (
      !itemName ||
      !category ||
      !measurementUnit ||
      !Number.isFinite(basePrice) ||
      basePrice <= 0 ||
      !modifierGroupsConfig
    ) {
      redirect(
        !modifierGroupsConfig
          ? "/restaurant?error=invalid-modifier-config"
          : "/restaurant?error=invalid-menu"
      );
    }

    const restaurant = await prisma.restaurantProfile.findUnique({
      where: { userId: authedUser.id },
      select: { id: true },
    });
    if (!restaurant) {
      redirect("/onboarding/restaurant");
    }

    let categoryRecord = await prisma.menuCategory.findFirst({
      where: {
        restaurantId: restaurant.id,
        category,
      },
      select: { id: true },
    });

    if (!categoryRecord) {
      categoryRecord = await prisma.menuCategory.create({
        data: {
          restaurantId: restaurant.id,
          category,
        },
        select: { id: true },
      });
    }

    await prisma.menuItem.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: categoryRecord.id,
        name: itemName,
        description: description || null,
        baseImageUrl: buildBaseImageUrl(itemName),
        isAvailable,
        measurements: {
          create: {
            unit: measurementUnit,
            basePrice: new Prisma.Decimal(basePrice.toFixed(2)),
          },
        },
        modifierGroups:
          modifierGroupsConfig.length > 0
            ? {
                create: modifierGroupsConfig.map((group) => ({
                  name: group.name,
                  isRequired: group.isRequired,
                  maxSelections: group.maxSelections,
                  options: {
                    create: group.options.map((option) => ({
                      name: option.name,
                      priceDelta: option.priceDelta,
                      maxQuantity: option.maxQuantity,
                      includedQuantity: option.includedQuantity,
                      defaultQuantity: option.defaultQuantity,
                    })),
                  },
                })),
              }
            : undefined,
      },
    });

    redirect("/restaurant?status=menu-item-added");
  }

  async function inviteStaffMember(formData: FormData) {
    "use server";

    const authedUser = await getUserFromSession();
    if (!authedUser || authedUser.role !== Role.RESTAURANT) {
      redirect("/login");
    }
    if (authedUser.status === "EMAIL_UNVERIFIED") {
      redirect(`/signup/verify?email=${encodeURIComponent(authedUser.email)}`);
    }

    const fullName = String(formData.get("fullName") || "").trim();
    const emailInput = String(formData.get("email") || "").trim().toLowerCase();
    const roleLabel = String(formData.get("role") || "").trim();
    const role =
      restaurantStaffRoleLabelToEnum[
        roleLabel as keyof typeof restaurantStaffRoleLabelToEnum
      ];

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!fullName || !role || !emailPattern.test(emailInput)) {
      redirect("/restaurant?error=invalid-staff");
    }

    const restaurant = await prisma.restaurantProfile.findUnique({
      where: { userId: authedUser.id },
      select: { id: true },
    });
    if (!restaurant) {
      redirect("/onboarding/restaurant");
    }

    const staffDelegate = (
      prisma as unknown as {
        restaurantStaffMember?: {
          upsert: typeof prisma.restaurantStaffMember.upsert;
        };
      }
    ).restaurantStaffMember;

    if (!staffDelegate?.upsert) {
      redirect("/restaurant?error=staff-unavailable");
    }

    try {
      await staffDelegate.upsert({
        where: {
          restaurantId_email: {
            restaurantId: restaurant.id,
            email: emailInput,
          },
        },
        update: {
          fullName,
          role,
          status: "INVITED",
        },
        create: {
          restaurantId: restaurant.id,
          fullName,
          email: emailInput,
          role,
        },
      });
    } catch {
      redirect("/restaurant?error=staff-unavailable");
    }

    redirect("/restaurant?status=staff-invited");
  }

  const statusMessage = resolvedSearchParams.status
    ? statusMessages[resolvedSearchParams.status]
    : null;
  const errorMessage = resolvedSearchParams.error
    ? errorMessages[resolvedSearchParams.error]
    : null;

  const menuItemCount = workspace.menuCategories.reduce(
    (sum, category) => sum + category.items.length,
    0
  );

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Restaurant workspace
          </p>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                Manage {workspace.restaurantName}
              </h1>
              <p className="text-sm text-muted-foreground">
                Configure menu pricing, operating hours, profile settings, and staff.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/onboarding/restaurant">Onboarding</Link>
              </Button>
              {user.status === "APPROVED" ? (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                  Approved and live
                </span>
              ) : (
                <span className="rounded-full border border-border/70 bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground">
                  Pending approval
                </span>
              )}
            </div>
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

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/70 shadow-sm">
            <CardContent className="space-y-1 py-4">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Menu items
              </p>
              <p className="text-2xl font-semibold">{menuItemCount}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardContent className="space-y-1 py-4">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Staff members
              </p>
              <p className="text-2xl font-semibold">{workspace.staffMembers.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardContent className="space-y-1 py-4">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Hours
              </p>
              <p className="text-2xl font-semibold">
                {workspace.openTime} - {workspace.closeTime}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Restaurant settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveRestaurantSettings} className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="restaurantName">Restaurant name</Label>
                <Input
                  id="restaurantName"
                  name="restaurantName"
                  defaultValue={workspace.restaurantName}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone number</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  defaultValue={workspace.phoneNumber}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Area</Label>
                <SelectField
                  name="area"
                  options={areaOptions}
                  defaultValue={areaEnumToLabel[workspace.area]}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="streetAddress">Street address</Label>
                <Input
                  id="streetAddress"
                  name="streetAddress"
                  defaultValue={workspace.streetAddress}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="openTime">Open time</Label>
                <Input
                  id="openTime"
                  name="openTime"
                  type="time"
                  defaultValue={workspace.openTime}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closeTime">Close time</Label>
                <Input
                  id="closeTime"
                  name="closeTime"
                  type="time"
                  defaultValue={workspace.closeTime}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Prep time range</Label>
                <SelectField
                  name="prepTime"
                  options={prepTimeOptions}
                  defaultValue={prepTimeEnumToLabel[workspace.prepTimeRange]}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Days open</Label>
                <MultiCheckboxGroup
                  name="days"
                  options={dayOptions}
                  defaultValues={workspace.daysOpen.map((day) => dayEnumToLabel[day])}
                  columns={3}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Cuisine types</Label>
                <MultiCheckboxGroup
                  name="cuisine"
                  options={cuisineTypes}
                  defaultValues={workspace.cuisineTypes.map(
                    (cuisine) => cuisineEnumToLabel[cuisine]
                  )}
                  columns={3}
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit">Save settings</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Menu builder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form action={addMenuItem} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="itemName">Item name</Label>
                <Input id="itemName" name="itemName" required />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <SelectField
                  name="category"
                  options={menuCategories}
                  defaultValue={menuCategories[0]}
                />
              </div>
              <div className="space-y-2">
                <Label>Measurement unit</Label>
                <SelectField
                  name="measurementUnit"
                  options={measurementUnits}
                  defaultValue={measurementUnits[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="basePrice">Base price</Label>
                <Input
                  id="basePrice"
                  name="basePrice"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea id="description" name="description" rows={3} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Modifiers (optional)</Label>
                <MenuModifierBuilder />
              </div>
              <label className="md:col-span-2 flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  name="isAvailable"
                  defaultChecked
                  className="h-4 w-4 rounded border-border/70"
                />
                Item is available for ordering
              </label>
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit">Add menu item</Button>
              </div>
            </form>

            {workspace.menuCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No menu items yet. Add your first item above.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {workspace.menuCategories.map((category) => (
                  <Card key={category.id} className="border-border/70">
                    <CardHeader>
                      <CardTitle className="text-base">
                        {menuCategoryEnumToLabel[category.category]}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      {category.items.length === 0 ? (
                        <p className="text-muted-foreground">No items in this category yet.</p>
                      ) : (
                        category.items.slice(0, 6).map((item) => (
                          <div key={item.id} className="rounded-lg border border-border/70 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <p className="font-medium">{item.name}</p>
                              <span className="text-xs text-muted-foreground">
                                {item.isAvailable ? "Available" : "Unavailable"}
                              </span>
                            </div>
                            {item.measurements.length > 0 ? (
                              <p className="text-xs text-muted-foreground">
                                {measurementEnumToLabel[item.measurements[0].unit]} |{" "}
                                {formatCurrency(Number(item.measurements[0].basePrice))}
                              </p>
                            ) : null}
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Staff</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form action={inviteStaffMember} className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" name="fullName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <SelectField
                  name="role"
                  options={restaurantStaffRoleOptions}
                  defaultValue={restaurantStaffRoleOptions[0]}
                />
              </div>
              <div className="md:col-span-3 flex justify-end">
                <Button type="submit">Invite staff</Button>
              </div>
            </form>

            {workspace.staffMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No staff members added yet.
              </p>
            ) : (
              <div className="grid gap-3">
                {workspace.staffMembers.map((staff) => (
                  <div
                    key={staff.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{staff.fullName}</p>
                      <p className="text-xs text-muted-foreground">{staff.email}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="rounded-full border border-border/70 px-3 py-1">
                        {restaurantStaffRoleEnumToLabel[staff.role]}
                      </span>
                      <span className="rounded-full border border-border/70 px-3 py-1 text-muted-foreground">
                        {restaurantStaffStatusEnumToLabel[staff.status]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
