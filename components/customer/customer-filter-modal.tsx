"use client";

import * as React from "react";
import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/forms/select-field";
import { MultiCheckboxGroup } from "@/components/forms/multi-checkbox-group";

type CustomerFilterModalProps = {
  areaOptions: readonly string[];
  prepTimeOptions: readonly string[];
  cuisineTypes: readonly string[];
  selectedArea?: string;
  selectedPrepTime?: string;
  selectedCuisineLabels?: string[];
  searchQuery?: string;
  activeCount?: number;
};

export function CustomerFilterModal({
  areaOptions,
  prepTimeOptions,
  cuisineTypes,
  selectedArea = "",
  selectedPrepTime = "",
  selectedCuisineLabels = [],
  searchQuery = "",
  activeCount = 0,
}: CustomerFilterModalProps) {
  const [open, setOpen] = React.useState(false);
  const hasActiveFilters = activeCount > 0;
  const clearHref = searchQuery
    ? `/customer?q=${encodeURIComponent(searchQuery)}`
    : "/customer";

  return (
    <div className="relative">
      <Button
        type="button"
        variant="secondary"
        className="h-12 rounded-full px-4 text-sm"
        onClick={() => setOpen(true)}
      >
        <SlidersHorizontal className="size-4" />
        Filters
        {hasActiveFilters ? (
          <span className="ml-1 rounded-full bg-foreground/10 px-2 py-0.5 text-xs font-semibold text-foreground">
            {activeCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative mx-auto mt-16 w-full max-w-3xl px-4">
            <div className="rounded-3xl border border-border/70 bg-background p-6 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                    Filters
                  </p>
                  <h2 className="text-2xl font-semibold">
                    Refine your marketplace.
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Choose area, prep time, or cuisine to narrow your results.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                >
                  <X className="size-5" />
                </Button>
              </div>

              <form method="GET" className="mt-6 grid gap-6">
                <input type="hidden" name="q" value={searchQuery} />
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Area</Label>
                    <SelectField
                      name="area"
                      options={areaOptions}
                      placeholder="All areas"
                      defaultValue={selectedArea}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Prep time</Label>
                    <SelectField
                      name="prep"
                      options={prepTimeOptions}
                      placeholder="Any prep time"
                      defaultValue={selectedPrepTime}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Cuisine</Label>
                    <MultiCheckboxGroup
                      name="cuisine"
                      options={cuisineTypes}
                      defaultValues={selectedCuisineLabels}
                      columns={3}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    Apply filters to refresh the list instantly.
                  </p>
                  <div className="flex gap-3">
                    <Button type="submit">Apply filters</Button>
                    <Button asChild variant="outline">
                      <Link href={clearHref}>Clear filters</Link>
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
