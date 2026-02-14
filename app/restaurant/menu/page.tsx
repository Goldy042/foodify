
import Link from "next/link";
import { redirect } from "next/navigation";
import { Prisma } from "@/app/generated/prisma/client";

import prisma from "@/lib/prisma";
import { AppHeader } from "@/components/app/app-header";
import { CloudinaryDirectUploadField } from "@/components/forms/cloudinary-direct-upload-field";
import { MenuModifierBuilder } from "@/components/forms/menu-modifier-builder";
import { SelectField } from "@/components/forms/select-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { measurementUnits, menuCategories } from "@/app/lib/constants";
import {
  measurementEnumToLabel,
  measurementLabelToEnum,
  menuCategoryEnumToLabel,
  menuCategoryLabelToEnum,
} from "@/app/lib/db";
import { formatCurrency } from "@/app/lib/pricing";
import { requireRestaurantUser } from "@/app/restaurant/_lib/guards";

type PageProps = {
  searchParams?: Promise<{ status?: string; error?: string }> | { status?: string; error?: string };
};

const statusMessages: Record<string, string> = {
  "menu-item-added": "Menu item was added successfully.",
  "menu-item-updated": "Menu item was updated successfully.",
  "menu-item-deleted": "Menu item was deleted.",
  "menu-item-disabled": "Menu item has order history and was disabled instead of deleted.",
};

const errorMessages: Record<string, string> = {
  "invalid-menu": "Provide valid menu item details before saving.",
  "invalid-modifier-config": "Modifier JSON is invalid. Check group fields and option limits.",
  "invalid-menu-image": "Upload a valid image file (max 5MB).",
  "menu-item-not-found": "Menu item no longer exists for this restaurant.",
  "menu-item-update-failed": "Could not update this menu item. Please try again.",
};

function buildBaseImageUrl(name: string) {
  const text = encodeURIComponent(name || "Foodify");
  return `https://placehold.co/640x420/png?text=${text}`;
}

function isValidImageUrl(value: string) {
  return value.startsWith("https://");
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

function parseModifierGroupsConfig(input: string): ParsedModifierGroupConfig[] | null {
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
    if (!rawGroup || typeof rawGroup !== "object") return null;
    const group = rawGroup as {
      name?: unknown;
      isRequired?: unknown;
      maxSelections?: unknown;
      options?: unknown;
    };

    const name = String(group.name ?? "").trim();
    const isRequired = Boolean(group.isRequired);
    const maxSelections = Number(group.maxSelections);

    if (!name || !Number.isInteger(maxSelections) || maxSelections < 1 || !Array.isArray(group.options) || group.options.length === 0) {
      return null;
    }

    const options = group.options.map((rawOption) => {
      if (!rawOption || typeof rawOption !== "object") return null;
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
        !Number.isFinite(priceDelta) || priceDelta < 0 ||
        !Number.isInteger(maxQuantity) || maxQuantity < 1 ||
        !Number.isInteger(includedQuantity) || includedQuantity < 0 || includedQuantity > maxQuantity ||
        !Number.isInteger(defaultQuantity) || defaultQuantity < 0 || defaultQuantity > maxQuantity
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

    if (options.some((entry) => entry === null)) return null;
    const selectedDefaults = options.filter((entry) => (entry as NonNullable<typeof entry>).defaultQuantity > 0).length;
    if (selectedDefaults > maxSelections) return null;

    groups.push({
      name,
      isRequired,
      maxSelections,
      options: options as NonNullable<(typeof options)[number]>[],
    });
  }

  return groups;
}

export default async function RestaurantMenuPage({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const user = await requireRestaurantUser();

  const workspace = await prisma.restaurantProfile.findUnique({
    where: { userId: user.id },
    include: {
      menuCategories: {
        orderBy: { createdAt: "asc" },
        include: {
          items: {
            orderBy: { createdAt: "desc" },
            include: {
              measurements: { orderBy: { createdAt: "asc" } },
              modifierGroups: { select: { id: true } },
              _count: { select: { orderItems: true } },
            },
          },
        },
      },
    },
  });

  if (!workspace) {
    redirect("/onboarding/restaurant");
  }
  async function addMenuItem(formData: FormData) {
    "use server";

    const authedUser = await requireRestaurantUser();

    const itemName = String(formData.get("itemName") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const categoryLabel = String(formData.get("category") || "").trim();
    const measurementLabel = String(formData.get("measurementUnit") || "").trim();
    const basePriceInput = String(formData.get("basePrice") || "").trim();
    const modifiersJson = String(formData.get("modifiersJson") || "").trim();
    const isAvailable = String(formData.get("isAvailable") || "") === "on";
    const uploadedImageUrl = String(formData.get("itemImageUrl") || "").trim();

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
          ? "/restaurant/menu?error=invalid-modifier-config"
          : "/restaurant/menu?error=invalid-menu"
      );
    }
    if (uploadedImageUrl && !isValidImageUrl(uploadedImageUrl)) {
      redirect("/restaurant/menu?error=invalid-menu-image");
    }

    const restaurant = await prisma.restaurantProfile.findUnique({
      where: { userId: authedUser.id },
      select: { id: true },
    });
    if (!restaurant) {
      redirect("/onboarding/restaurant");
    }

    const baseImageUrl = uploadedImageUrl || buildBaseImageUrl(itemName);

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
        baseImageUrl,
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

    redirect("/restaurant/menu?status=menu-item-added");
  }

  async function editMenuItem(formData: FormData) {
    "use server";

    const authedUser = await requireRestaurantUser();

    const menuItemId = String(formData.get("menuItemId") || "").trim();
    const itemName = String(formData.get("itemName") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const categoryLabel = String(formData.get("category") || "").trim();
    const measurementLabel = String(formData.get("measurementUnit") || "").trim();
    const basePriceInput = String(formData.get("basePrice") || "").trim();
    const isAvailable = String(formData.get("isAvailable") || "") === "on";
    const removeImage = String(formData.get("removeImage") || "") === "on";
    const uploadedImageUrl = String(formData.get("itemImageUrl") || "").trim();

    const category =
      menuCategoryLabelToEnum[categoryLabel as keyof typeof menuCategoryLabelToEnum];
    const measurementUnit =
      measurementLabelToEnum[
        measurementLabel as keyof typeof measurementLabelToEnum
      ];
    const basePrice = Number(basePriceInput);

    if (
      !menuItemId ||
      !itemName ||
      !category ||
      !measurementUnit ||
      !Number.isFinite(basePrice) ||
      basePrice <= 0
    ) {
      redirect("/restaurant/menu?error=invalid-menu");
    }
    if (uploadedImageUrl && !isValidImageUrl(uploadedImageUrl)) {
      redirect("/restaurant/menu?error=invalid-menu-image");
    }

    const restaurant = await prisma.restaurantProfile.findUnique({
      where: { userId: authedUser.id },
      select: { id: true },
    });
    if (!restaurant) {
      redirect("/onboarding/restaurant");
    }

    const existingMenuItem = await prisma.menuItem.findFirst({
      where: {
        id: menuItemId,
        restaurantId: restaurant.id,
      },
      select: {
        id: true,
        baseImageUrl: true,
        measurements: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
          },
          take: 1,
        },
      },
    });

    if (!existingMenuItem) {
      redirect("/restaurant/menu?error=menu-item-not-found");
    }

    let nextImageUrl = existingMenuItem.baseImageUrl;
    if (removeImage) {
      nextImageUrl = buildBaseImageUrl(itemName);
    }

    if (uploadedImageUrl) {
      nextImageUrl = uploadedImageUrl;
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

    try {
      await prisma.menuItem.update({
        where: {
          id: existingMenuItem.id,
        },
        data: {
          name: itemName,
          description: description || null,
          baseImageUrl: nextImageUrl,
          isAvailable,
          categoryId: categoryRecord.id,
          measurements: existingMenuItem.measurements[0]
            ? {
                update: {
                  where: { id: existingMenuItem.measurements[0].id },
                  data: {
                    unit: measurementUnit,
                    basePrice: new Prisma.Decimal(basePrice.toFixed(2)),
                  },
                },
              }
            : {
                create: {
                  unit: measurementUnit,
                  basePrice: new Prisma.Decimal(basePrice.toFixed(2)),
                },
              },
        },
      });
    } catch {
      redirect("/restaurant/menu?error=menu-item-update-failed");
    }

    redirect("/restaurant/menu?status=menu-item-updated");
  }

  async function removeMenuItem(formData: FormData) {
    "use server";

    const authedUser = await requireRestaurantUser();
    const menuItemId = String(formData.get("menuItemId") || "").trim();

    if (!menuItemId) {
      redirect("/restaurant/menu?error=menu-item-not-found");
    }

    const restaurant = await prisma.restaurantProfile.findUnique({
      where: { userId: authedUser.id },
      select: { id: true },
    });
    if (!restaurant) {
      redirect("/onboarding/restaurant");
    }

    const existingMenuItem = await prisma.menuItem.findFirst({
      where: {
        id: menuItemId,
        restaurantId: restaurant.id,
      },
      select: {
        id: true,
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
    });

    if (!existingMenuItem) {
      redirect("/restaurant/menu?error=menu-item-not-found");
    }

    if (existingMenuItem._count.orderItems > 0) {
      await prisma.menuItem.update({
        where: { id: existingMenuItem.id },
        data: { isAvailable: false },
      });
      redirect("/restaurant/menu?status=menu-item-disabled");
    }

    await prisma.$transaction(async (tx) => {
      await tx.modifierOption.deleteMany({
        where: {
          modifierGroup: {
            menuItemId: existingMenuItem.id,
          },
        },
      });
      await tx.modifierGroup.deleteMany({
        where: {
          menuItemId: existingMenuItem.id,
        },
      });
      await tx.menuItemMeasurement.deleteMany({
        where: {
          menuItemId: existingMenuItem.id,
        },
      });
      await tx.menuItem.delete({ where: { id: existingMenuItem.id } });
      await tx.menuCategory.deleteMany({
        where: {
          restaurantId: restaurant.id,
          items: { none: {} },
        },
      });
    });

    redirect("/restaurant/menu?status=menu-item-deleted");
  }

  const statusMessage = resolvedSearchParams.status ? statusMessages[resolvedSearchParams.status] : null;
  const errorMessage = resolvedSearchParams.error ? errorMessages[resolvedSearchParams.error] : null;

  const menuItemCount = workspace.menuCategories.reduce((sum, category) => sum + category.items.length, 0);
  const availableCount = workspace.menuCategories.reduce(
    (sum, category) => sum + category.items.filter((item) => item.isAvailable).length,
    0
  );
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Restaurant Menu</p>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Menu Manager</h1>
              <p className="text-sm text-muted-foreground">
                Create, edit, and organize your menu items in one dedicated workspace.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/restaurant">Back to dashboard</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/restaurant/workspace">Legacy workspace</Link>
              </Button>
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
          <Card className="border-border/70 shadow-sm"><CardContent className="space-y-1 py-4"><p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Total items</p><p className="text-2xl font-semibold">{menuItemCount}</p></CardContent></Card>
          <Card className="border-border/70 shadow-sm"><CardContent className="space-y-1 py-4"><p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Available</p><p className="text-2xl font-semibold">{availableCount}</p></CardContent></Card>
          <Card className="border-border/70 shadow-sm"><CardContent className="space-y-1 py-4"><p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Categories</p><p className="text-2xl font-semibold">{workspace.menuCategories.length}</p></CardContent></Card>
        </div>

        <Card className="border-border/70 shadow-sm">
          <CardHeader><CardTitle className="text-xl">Menu Builder</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="create" className="gap-5">
              <TabsList className="h-auto w-full justify-start gap-2 overflow-x-auto rounded-xl border border-border/70 bg-background p-2">
                <TabsTrigger value="create" className="h-auto min-w-fit rounded-lg border border-transparent px-4 py-2 data-[state=active]:border-border/70">Create item</TabsTrigger>
                <TabsTrigger value="manage" className="h-auto min-w-fit rounded-lg border border-transparent px-4 py-2 data-[state=active]:border-border/70">Edit existing</TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="space-y-4">
                <Card className="border-border/70 bg-muted/20 py-4 shadow-none">
                  <CardContent>
                    <form action={addMenuItem} className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2"><Label htmlFor="itemName">Item name</Label><Input id="itemName" name="itemName" required /></div>
                      <div className="space-y-2"><Label>Category</Label><SelectField name="category" options={menuCategories} defaultValue={menuCategories[0]} /></div>
                      <div className="space-y-2"><Label>Measurement unit</Label><SelectField name="measurementUnit" options={measurementUnits} defaultValue={measurementUnits[0]} /></div>
                      <div className="space-y-2"><Label htmlFor="basePrice">Base price</Label><Input id="basePrice" name="basePrice" type="number" step="0.01" min="0.01" required /></div>
                      <div className="space-y-2 md:col-span-2"><Label htmlFor="description">Description (optional)</Label><Textarea id="description" name="description" rows={3} /></div>
                      <div className="space-y-2 md:col-span-2"><Label>Menu image (optional)</Label><CloudinaryDirectUploadField name="itemImageUrl" /></div>
                      <div className="space-y-2 md:col-span-2"><Label>Modifiers (optional)</Label><MenuModifierBuilder /></div>
                      <label className="md:col-span-2 flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" name="isAvailable" defaultChecked className="h-4 w-4 rounded border-border/70" />Item is available for ordering</label>
                      <div className="md:col-span-2 flex justify-end"><Button type="submit">Add menu item</Button></div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="manage" className="space-y-4">
                {workspace.menuCategories.length === 0 ? (
                  <Card className="border-border/70 bg-muted/20 py-6 shadow-none"><CardContent><p className="text-sm text-muted-foreground">No menu items yet. Switch to create item to add your first one.</p></CardContent></Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {workspace.menuCategories.map((category) => (
                      <Card key={category.id} className="border-border/70">
                        <CardHeader className="border-b border-border/60 pb-4">
                          <CardTitle className="text-base">{menuCategoryEnumToLabel[category.category]}</CardTitle>
                          <p className="text-xs text-muted-foreground">{category.items.length} item{category.items.length === 1 ? "" : "s"}</p>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-4 text-sm">
                          {category.items.length === 0 ? (
                            <p className="text-muted-foreground">No items in this category yet.</p>
                          ) : (
                            category.items.map((item) => (
                              <div key={item.id} className="rounded-lg border border-border/70 bg-card/80 p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <p className="font-medium">{item.name}</p>
                                  <span className="text-xs text-muted-foreground">{item.isAvailable ? "Available" : "Unavailable"}</span>
                                </div>
                                <div className="mt-2 h-28 w-full overflow-hidden rounded-md border border-border/70 bg-muted/30">
                                  {item.baseImageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={item.baseImageUrl} alt={`${item.name} image`} className="h-full w-full object-cover" loading="lazy" />
                                  ) : (
                                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>
                                  )}
                                </div>
                                {item.measurements.length > 0 ? (
                                  <p className="mt-2 text-xs text-muted-foreground">{measurementEnumToLabel[item.measurements[0].unit]} | {formatCurrency(Number(item.measurements[0].basePrice))}</p>
                                ) : null}
                                <p className="mt-1 text-xs text-muted-foreground">{item.modifierGroups.length} modifier group{item.modifierGroups.length === 1 ? "" : "s"} | {item._count.orderItems} order{item._count.orderItems === 1 ? "" : "s"}</p>

                                <details className="mt-3 rounded-md border border-border/70 p-3">
                                  <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Edit item</summary>
                                  <form action={editMenuItem} className="mt-3 grid gap-3">
                                    <input type="hidden" name="menuItemId" value={item.id} />
                                    <div className="space-y-1"><Label htmlFor={`itemName-${item.id}`}>Item name</Label><Input id={`itemName-${item.id}`} name="itemName" defaultValue={item.name} required /></div>
                                    <div className="space-y-1"><Label htmlFor={`description-${item.id}`}>Description</Label><Textarea id={`description-${item.id}`} name="description" rows={2} defaultValue={item.description ?? ""} /></div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                      <div className="space-y-1"><Label>Category</Label><SelectField name="category" options={menuCategories} defaultValue={menuCategoryEnumToLabel[category.category]} /></div>
                                      <div className="space-y-1"><Label>Measurement unit</Label><SelectField name="measurementUnit" options={measurementUnits} defaultValue={item.measurements[0] ? measurementEnumToLabel[item.measurements[0].unit] : measurementUnits[0]} /></div>
                                    </div>
                                    <div className="space-y-1"><Label htmlFor={`basePrice-${item.id}`}>Base price</Label><Input id={`basePrice-${item.id}`} name="basePrice" type="number" min="0.01" step="0.01" defaultValue={item.measurements[0] ? Number(item.measurements[0].basePrice) : ""} required /></div>
                                    <div className="space-y-1"><Label>Replace image</Label><CloudinaryDirectUploadField name="itemImageUrl" defaultValue={item.baseImageUrl} /></div>
                                    <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" name="removeImage" className="h-4 w-4 rounded border-border/70" />Reset image to placeholder</label>
                                    <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" name="isAvailable" defaultChecked={item.isAvailable} className="h-4 w-4 rounded border-border/70" />Item is available for ordering</label>
                                    <div className="flex justify-end"><Button type="submit" size="sm">Save changes</Button></div>
                                  </form>

                                  <form action={removeMenuItem} className="mt-3">
                                    <input type="hidden" name="menuItemId" value={item.id} />
                                    <Button type="submit" size="sm" variant="destructive">{item._count.orderItems > 0 ? "Disable item" : "Delete item"}</Button>
                                  </form>
                                </details>
                              </div>
                            ))
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
