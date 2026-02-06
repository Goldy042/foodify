"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addToCart } from "@/app/lib/cart";
import { formatCurrency } from "@/app/lib/pricing";
import { measurementEnumToLabel } from "@/app/lib/labels";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type MeasurementOption = {
  id: string;
  unit: string;
  basePrice: number;
};

type ModifierOption = {
  id: string;
  name: string;
  priceDelta: number;
};

type ModifierGroup = {
  id: string;
  name: string;
  isRequired: boolean;
  maxSelections: number;
  options: ModifierOption[];
};

type MenuItemActionsProps = {
  restaurant: { id: string; name: string };
  item: { id: string; name: string };
  measurements: MeasurementOption[];
  modifierGroups: ModifierGroup[];
};

export function MenuItemActions({
  restaurant,
  item,
  measurements,
  modifierGroups,
}: MenuItemActionsProps) {
  const [measurementId, setMeasurementId] = React.useState(
    measurements[0]?.id ?? ""
  );
  const [quantity, setQuantity] = React.useState(1);
  const [added, setAdded] = React.useState(false);
  const [selectedModifiers, setSelectedModifiers] = React.useState<
    Record<string, string[]>
  >({});

  const selectedMeasurement =
    measurements.find((measurement) => measurement.id === measurementId) ??
    measurements[0];

  const missingRequired = modifierGroups.some((group) => {
    if (!group.isRequired) {
      return false;
    }
    return (selectedModifiers[group.id]?.length ?? 0) === 0;
  });

  const canAdd = Boolean(selectedMeasurement) && !missingRequired;

  const selectedModifierOptions = modifierGroups.flatMap((group) => {
    const selections = selectedModifiers[group.id] ?? [];
    return group.options.filter((option) => selections.includes(option.id));
  });

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-3">
        {modifierGroups.length > 0 ? (
          <div className="grid gap-3">
            {modifierGroups.map((group) => (
              <div key={group.id} className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Label className="text-sm font-semibold">{group.name}</Label>
                  <span className="rounded-full border border-border/70 px-2 py-0.5 text-[10px] uppercase">
                    {group.isRequired ? "Required" : "Optional"}
                  </span>
                  <span className="text-muted-foreground">
                    Max {group.maxSelections}
                  </span>
                </div>
                {group.maxSelections === 1 ? (
                  <RadioGroup
                    value={selectedModifiers[group.id]?.[0] ?? ""}
                    onValueChange={(value) => {
                      setSelectedModifiers((prev) => ({
                        ...prev,
                        [group.id]: value ? [value] : [],
                      }));
                    }}
                    className="grid gap-2"
                  >
                    {group.options.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-center gap-3 rounded-lg border border-border/70 px-3 py-2 text-xs"
                      >
                        <RadioGroupItem value={option.id} />
                        <span className="flex-1">{option.name}</span>
                        <span className="text-muted-foreground">
                          {formatCurrency(option.priceDelta)}
                        </span>
                      </label>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {group.options.map((option) => {
                      const selections = selectedModifiers[group.id] ?? [];
                      const checked = selections.includes(option.id);
                      const atLimit =
                        selections.length >= group.maxSelections && !checked;
                      return (
                        <label
                          key={option.id}
                          className={`flex items-center gap-3 rounded-lg border border-border/70 px-3 py-2 text-xs ${
                            atLimit ? "opacity-60" : ""
                          }`}
                        >
                          <Checkbox
                            checked={checked}
                            disabled={atLimit}
                            onCheckedChange={(next) => {
                              setSelectedModifiers((prev) => {
                                const current = prev[group.id] ?? [];
                                if (next) {
                                  if (current.length >= group.maxSelections) {
                                    return prev;
                                  }
                                  return {
                                    ...prev,
                                    [group.id]: [...current, option.id],
                                  };
                                }
                                return {
                                  ...prev,
                                  [group.id]: current.filter(
                                    (value) => value !== option.id
                                  ),
                                };
                              });
                            }}
                          />
                          <span className="flex-1">{option.name}</span>
                          <span className="text-muted-foreground">
                            {formatCurrency(option.priceDelta)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select value={measurementId} onValueChange={setMeasurementId}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Select size" />
          </SelectTrigger>
          <SelectContent>
            {measurements.map((measurement) => (
              <SelectItem key={measurement.id} value={measurement.id}>
                {measurementEnumToLabel[measurement.unit] ?? measurement.unit} •{" "}
                {formatCurrency(measurement.basePrice)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          min={1}
          className="w-24"
          value={quantity}
          onChange={(event) => {
            const value = Number(event.target.value);
            setQuantity(Number.isFinite(value) ? Math.max(1, value) : 1);
          }}
        />
        </div>
      </div>
      <Button
        type="button"
        disabled={!canAdd}
        onClick={() => {
          if (!selectedMeasurement) {
            return;
          }
          addToCart(restaurant, {
            menuItemId: item.id,
            measurementId: selectedMeasurement.id,
            name: item.name,
            measurementUnit: selectedMeasurement.unit,
            unitPrice: selectedMeasurement.basePrice,
            quantity,
            modifiers: selectedModifierOptions.map((option) => ({
              id: option.id,
              name: option.name,
              priceDelta: option.priceDelta,
            })),
          });
          setAdded(true);
          window.setTimeout(() => setAdded(false), 2000);
        }}
      >
        {added ? "Added" : "Add to cart"}
      </Button>
    </div>
  );
}
