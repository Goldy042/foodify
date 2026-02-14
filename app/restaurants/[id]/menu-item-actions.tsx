"use client";

import * as React from "react";

import { addToCart, MAX_CART_QUANTITY } from "@/app/lib/cart";
import { measurementEnumToLabel } from "@/app/lib/labels";
import { formatCurrency } from "@/app/lib/pricing";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MeasurementOption = {
  id: string;
  unit: string;
  basePrice: number;
};

type ModifierOption = {
  id: string;
  name: string;
  priceDelta: number;
  maxQuantity: number;
  includedQuantity: number;
  defaultQuantity: number;
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
  disabled?: boolean;
  disabledReason?: "unavailable" | "closed";
};

type ModifierSelectionMap = Record<string, Record<string, number>>;

function getDefaultSelections(groups: ModifierGroup[]): ModifierSelectionMap {
  const defaults: ModifierSelectionMap = {};

  for (const group of groups) {
    const groupDefaults: Record<string, number> = {};
    let selectedCount = 0;

    for (const option of group.options) {
      const maxQuantity = Math.max(1, Math.floor(option.maxQuantity));
      const quantity = Math.max(
        0,
        Math.min(maxQuantity, Math.floor(option.defaultQuantity))
      );

      if (quantity > 0) {
        if (selectedCount >= group.maxSelections) {
          continue;
        }
        groupDefaults[option.id] = quantity;
        selectedCount += 1;
      }
    }

    if (Object.keys(groupDefaults).length > 0) {
      defaults[group.id] = groupDefaults;
    }
  }

  return defaults;
}

export function MenuItemActions({
  restaurant,
  item,
  measurements,
  modifierGroups,
  disabled = false,
  disabledReason = "unavailable",
}: MenuItemActionsProps) {
  const [measurementId, setMeasurementId] = React.useState(
    measurements[0]?.id ?? ""
  );
  const [quantity, setQuantity] = React.useState(1);
  const [added, setAdded] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const feedbackTimerRef = React.useRef<number | null>(null);
  const [selectedModifiers, setSelectedModifiers] = React.useState<ModifierSelectionMap>(
    getDefaultSelections(modifierGroups)
  );

  React.useEffect(() => {
    setSelectedModifiers(getDefaultSelections(modifierGroups));
  }, [modifierGroups]);

  const selectedMeasurement =
    measurements.find((measurement) => measurement.id === measurementId) ??
    measurements[0];

  const selectedCountByGroup = React.useMemo(() => {
    const entries = Object.entries(selectedModifiers).map(([groupId, selections]) => {
      const selectedCount = Object.values(selections).filter((value) => value > 0)
        .length;
      return [groupId, selectedCount] as const;
    });
    return Object.fromEntries(entries);
  }, [selectedModifiers]);

  const missingRequired = modifierGroups.some((group) => {
    if (!group.isRequired) {
      return false;
    }
    return (selectedCountByGroup[group.id] ?? 0) === 0;
  });

  const canAdd = !disabled && Boolean(selectedMeasurement) && !missingRequired;

  const selectedModifierOptions = modifierGroups.flatMap((group) => {
    const groupSelections = selectedModifiers[group.id] ?? {};
    return group.options
      .map((option) => {
        const selectedQuantity = Math.floor(groupSelections[option.id] ?? 0);
        if (selectedQuantity < 1) {
          return null;
        }
        return {
          id: option.id,
          name: option.name,
          priceDelta: option.priceDelta,
          quantity: selectedQuantity,
          includedQuantity: Math.max(0, Math.floor(option.includedQuantity)),
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      name: string;
      priceDelta: number;
      quantity: number;
      includedQuantity: number;
    }>;
  });

  React.useEffect(() => {
    return () => {
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  function setOptionQuantity(group: ModifierGroup, option: ModifierOption, next: number) {
    const maxQuantity = Math.max(1, Math.floor(option.maxQuantity));
    const clamped = Math.max(0, Math.min(maxQuantity, Math.floor(next)));

    setSelectedModifiers((prev) => {
      const groupSelections = { ...(prev[group.id] ?? {}) };
      const currentlySelected = Object.values(groupSelections).filter((value) => value > 0)
        .length;
      const currentValue = Math.floor(groupSelections[option.id] ?? 0);
      const isTurningOn = currentValue < 1 && clamped > 0;

      if (isTurningOn && currentlySelected >= group.maxSelections) {
        return prev;
      }

      if (clamped <= 0) {
        delete groupSelections[option.id];
      } else {
        groupSelections[option.id] = clamped;
      }

      return {
        ...prev,
        [group.id]: groupSelections,
      };
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {modifierGroups.length > 0 ? (
          <details className="rounded-xl border border-border/70 bg-muted/20" open={missingRequired}>
            <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium">
              Customize add-ons
            </summary>
            <div className="grid gap-3 px-3 pb-3">
              {modifierGroups.map((group) => {
                const groupSelections = selectedModifiers[group.id] ?? {};
                const selectedCount = selectedCountByGroup[group.id] ?? 0;

                return (
                  <div key={group.id} className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Label className="text-sm font-semibold">{group.name}</Label>
                      <span className="rounded-full border border-border/70 px-2 py-0.5 text-[10px] uppercase">
                        {group.isRequired ? "Required" : "Optional"}
                      </span>
                      <span className="text-muted-foreground">Max {group.maxSelections}</span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {group.options.map((option) => {
                        const selectedQuantity = Math.floor(groupSelections[option.id] ?? 0);
                        const checked = selectedQuantity > 0;
                        const selectionLimitReached =
                          selectedCount >= group.maxSelections && !checked;
                        const chargeableQty = Math.max(
                          0,
                          selectedQuantity - Math.max(0, option.includedQuantity)
                        );

                        return (
                          <div
                            key={option.id}
                            className={`space-y-2 rounded-lg border border-border/70 bg-background px-3 py-2 text-xs ${
                              selectionLimitReached ? "opacity-60" : ""
                            }`}
                          >
                            <label className="flex items-center gap-3">
                              <Checkbox
                                checked={checked}
                                disabled={disabled || selectionLimitReached}
                                onCheckedChange={(next) => {
                                  if (next) {
                                    const defaultQuantity = Math.max(
                                      1,
                                      Math.min(option.maxQuantity, option.defaultQuantity || 1)
                                    );
                                    setOptionQuantity(group, option, defaultQuantity);
                                    return;
                                  }
                                  setOptionQuantity(group, option, 0);
                                }}
                              />
                              <span className="flex-1">{option.name}</span>
                              <span className="text-muted-foreground">
                                +{formatCurrency(option.priceDelta)} each
                              </span>
                            </label>

                            {checked ? (
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={disabled}
                                    onClick={() =>
                                      setOptionQuantity(group, option, selectedQuantity - 1)
                                    }
                                  >
                                    -
                                  </Button>
                                  <span className="min-w-6 text-center font-medium">
                                    {selectedQuantity}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={disabled}
                                    onClick={() =>
                                      setOptionQuantity(group, option, selectedQuantity + 1)
                                    }
                                  >
                                    +
                                  </Button>
                                  <span className="text-muted-foreground">
                                    max {option.maxQuantity}
                                  </span>
                                </div>
                                {option.includedQuantity > 0 ? (
                                  <span className="text-muted-foreground">
                                    {chargeableQty > 0
                                      ? `${option.includedQuantity} included`
                                      : "Included"}
                                  </span>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        ) : null}

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <Select
            value={measurementId}
            onValueChange={setMeasurementId}
            disabled={disabled}
          >
            <SelectTrigger className="w-full md:w-56">
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              {measurements.map((measurement) => (
                <SelectItem key={measurement.id} value={measurement.id}>
                  {measurementEnumToLabel[measurement.unit] ?? measurement.unit} |{" "}
                  {formatCurrency(measurement.basePrice)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            min={1}
            max={MAX_CART_QUANTITY}
            className="w-full md:w-24"
            disabled={disabled}
            value={quantity}
            onChange={(event) => {
              const value = Number(event.target.value);
              setQuantity(
                Number.isFinite(value)
                  ? Math.min(MAX_CART_QUANTITY, Math.max(1, value))
                  : 1
              );
            }}
          />
        </div>

        {missingRequired && !disabled ? (
          <p className="text-xs text-muted-foreground">
            Select required modifiers before adding this item.
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          disabled={!canAdd}
          onClick={() => {
            if (!selectedMeasurement) {
              return;
            }

            const result = addToCart(restaurant, {
              menuItemId: item.id,
              measurementId: selectedMeasurement.id,
              name: item.name,
              measurementUnit: selectedMeasurement.unit,
              unitPrice: selectedMeasurement.basePrice,
              quantity,
              modifiers: selectedModifierOptions,
            });

            if (result.status === "invalid") {
              setAdded(false);
              setFeedback("Could not add this item. Please try again.");
              if (feedbackTimerRef.current !== null) {
                window.clearTimeout(feedbackTimerRef.current);
              }
              feedbackTimerRef.current = window.setTimeout(
                () => setFeedback(null),
                2200
              );
              return;
            }

            if (result.status === "cancelled") {
              setAdded(false);
              setFeedback("Kept your existing cart.");
              if (feedbackTimerRef.current !== null) {
                window.clearTimeout(feedbackTimerRef.current);
              }
              feedbackTimerRef.current = window.setTimeout(
                () => setFeedback(null),
                2200
              );
              return;
            }

            if (result.status === "replaced") {
              setFeedback("Started a new cart for this restaurant.");
            } else if (result.status === "merged") {
              setFeedback("Updated quantity in your cart.");
            } else {
              setFeedback("Added to cart.");
            }
            setAdded(true);
            if (feedbackTimerRef.current !== null) {
              window.clearTimeout(feedbackTimerRef.current);
            }
            feedbackTimerRef.current = window.setTimeout(() => {
              setAdded(false);
              setFeedback(null);
            }, 2200);
          }}
        >
          {disabled
            ? disabledReason === "closed"
              ? "Closed"
              : "Unavailable"
            : added
              ? "Added"
              : "Add to cart"}
        </Button>
        {feedback ? <p className="text-xs text-muted-foreground">{feedback}</p> : null}
      </div>
    </div>
  );
}
