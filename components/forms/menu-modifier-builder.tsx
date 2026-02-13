"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type OptionDraft = {
  name: string;
  priceDelta: number;
  maxQuantity: number;
  includedQuantity: number;
  defaultQuantity: number;
};

type GroupDraft = {
  name: string;
  isRequired: boolean;
  maxSelections: number;
  options: OptionDraft[];
};

const DEFAULT_OPTION: OptionDraft = {
  name: "Option 1",
  priceDelta: 0,
  maxQuantity: 1,
  includedQuantity: 0,
  defaultQuantity: 0,
};

const EGUSI_PRESET: GroupDraft[] = [
  {
    name: "Fufu Wraps",
    isRequired: true,
    maxSelections: 1,
    options: [
      {
        name: "Fufu",
        priceDelta: 350,
        maxQuantity: 6,
        includedQuantity: 2,
        defaultQuantity: 2,
      },
    ],
  },
  {
    name: "Protein",
    isRequired: false,
    maxSelections: 2,
    options: [
      {
        name: "Beef",
        priceDelta: 600,
        maxQuantity: 3,
        includedQuantity: 0,
        defaultQuantity: 0,
      },
      {
        name: "Goat Meat",
        priceDelta: 750,
        maxQuantity: 2,
        includedQuantity: 0,
        defaultQuantity: 0,
      },
    ],
  },
  {
    name: "Drinks",
    isRequired: false,
    maxSelections: 1,
    options: [
      {
        name: "Malt",
        priceDelta: 300,
        maxQuantity: 1,
        includedQuantity: 0,
        defaultQuantity: 1,
      },
      {
        name: "Water",
        priceDelta: 0,
        maxQuantity: 1,
        includedQuantity: 0,
        defaultQuantity: 0,
      },
    ],
  },
];

function clampInt(value: number, min: number, max?: number) {
  if (!Number.isFinite(value)) {
    return min;
  }
  const next = Math.floor(value);
  if (next < min) {
    return min;
  }
  if (typeof max === "number" && next > max) {
    return max;
  }
  return next;
}

function sanitizeGroup(group: GroupDraft) {
  const maxSelections = clampInt(group.maxSelections, 1);
  const options = group.options.map((option) => {
    const maxQuantity = clampInt(option.maxQuantity, 1);
    const includedQuantity = clampInt(option.includedQuantity, 0, maxQuantity);
    const defaultQuantity = clampInt(option.defaultQuantity, 0, maxQuantity);

    return {
      name: option.name.trim(),
      priceDelta: Number(option.priceDelta) || 0,
      maxQuantity,
      includedQuantity,
      defaultQuantity,
    };
  });

  return {
    name: group.name.trim(),
    isRequired: Boolean(group.isRequired),
    maxSelections,
    options,
  };
}

export function MenuModifierBuilder() {
  const [groups, setGroups] = React.useState<GroupDraft[]>([]);

  const payload = React.useMemo(() => {
    const sanitized = groups.map(sanitizeGroup);
    return sanitized.length > 0 ? JSON.stringify(sanitized) : "";
  }, [groups]);

  function addGroup() {
    setGroups((prev) => [
      ...prev,
      {
        name: `Group ${prev.length + 1}`,
        isRequired: false,
        maxSelections: 1,
        options: [{ ...DEFAULT_OPTION }],
      },
    ]);
  }

  function removeGroup(index: number) {
    setGroups((prev) => prev.filter((_, entryIndex) => entryIndex !== index));
  }

  function updateGroup(index: number, updater: (group: GroupDraft) => GroupDraft) {
    setGroups((prev) =>
      prev.map((group, entryIndex) =>
        entryIndex === index ? updater(group) : group
      )
    );
  }

  function addOption(groupIndex: number) {
    updateGroup(groupIndex, (group) => ({
      ...group,
      options: [
        ...group.options,
        { ...DEFAULT_OPTION, name: `Option ${group.options.length + 1}` },
      ],
    }));
  }

  function removeOption(groupIndex: number, optionIndex: number) {
    updateGroup(groupIndex, (group) => ({
      ...group,
      options: group.options.filter((_, entryIndex) => entryIndex !== optionIndex),
    }));
  }

  function updateOption(
    groupIndex: number,
    optionIndex: number,
    updater: (option: OptionDraft) => OptionDraft
  ) {
    updateGroup(groupIndex, (group) => ({
      ...group,
      options: group.options.map((option, entryIndex) =>
        entryIndex === optionIndex ? updater(option) : option
      ),
    }));
  }

  return (
    <div className="space-y-4 rounded-lg border border-border/70 bg-muted/20 p-4">
      <input type="hidden" name="modifiersJson" value={payload} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-1">
          <p className="text-sm font-medium">Modifier builder</p>
          <p className="text-xs text-muted-foreground">
            Add wraps, proteins, and drinks without writing JSON.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={addGroup}>
            Add group
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setGroups(EGUSI_PRESET)}
          >
            Load Egusi preset
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setGroups([])}
          >
            Clear
          </Button>
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No modifier groups yet. Click "Add group" or "Load Egusi preset".
        </p>
      ) : (
        <div className="space-y-4">
          {groups.map((group, groupIndex) => (
            <div key={`group-${groupIndex}`} className="space-y-3 rounded-lg border border-border/70 bg-background p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">Group {groupIndex + 1}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeGroup(groupIndex)}
                >
                  Remove group
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2 md:col-span-2">
                  <Label>Group name</Label>
                  <Input
                    value={group.name}
                    onChange={(event) =>
                      updateGroup(groupIndex, (current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max selections</Label>
                  <Input
                    type="number"
                    min={1}
                    value={group.maxSelections}
                    onChange={(event) =>
                      updateGroup(groupIndex, (current) => ({
                        ...current,
                        maxSelections: clampInt(Number(event.target.value), 1),
                      }))
                    }
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={group.isRequired}
                  onCheckedChange={(checked) =>
                    updateGroup(groupIndex, (current) => ({
                      ...current,
                      isRequired: Boolean(checked),
                    }))
                  }
                />
                Required group
              </label>

              <div className="space-y-3">
                {group.options.map((option, optionIndex) => (
                  <div
                    key={`group-${groupIndex}-option-${optionIndex}`}
                    className="space-y-3 rounded-md border border-border/60 bg-muted/10 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold">Option {optionIndex + 1}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(groupIndex, optionIndex)}
                      >
                        Remove option
                      </Button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-5">
                      <div className="space-y-2 md:col-span-2">
                        <Label>Name</Label>
                        <Input
                          value={option.name}
                          onChange={(event) =>
                            updateOption(groupIndex, optionIndex, (current) => ({
                              ...current,
                              name: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Price delta</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={option.priceDelta}
                          onChange={(event) =>
                            updateOption(groupIndex, optionIndex, (current) => ({
                              ...current,
                              priceDelta: Number(event.target.value) || 0,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max qty</Label>
                        <Input
                          type="number"
                          min={1}
                          value={option.maxQuantity}
                          onChange={(event) =>
                            updateOption(groupIndex, optionIndex, (current) => ({
                              ...current,
                              maxQuantity: clampInt(Number(event.target.value), 1),
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Included qty</Label>
                        <Input
                          type="number"
                          min={0}
                          value={option.includedQuantity}
                          onChange={(event) =>
                            updateOption(groupIndex, optionIndex, (current) => ({
                              ...current,
                              includedQuantity: clampInt(
                                Number(event.target.value),
                                0,
                                current.maxQuantity
                              ),
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Default qty</Label>
                        <Input
                          type="number"
                          min={0}
                          value={option.defaultQuantity}
                          onChange={(event) =>
                            updateOption(groupIndex, optionIndex, (current) => ({
                              ...current,
                              defaultQuantity: clampInt(
                                Number(event.target.value),
                                0,
                                current.maxQuantity
                              ),
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addOption(groupIndex)}
              >
                Add option
              </Button>
            </div>
          ))}
        </div>
      )}

      <details className="rounded-md border border-border/60 bg-background p-3">
        <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
          Advanced: View generated JSON
        </summary>
        <div className="mt-2">
          <Textarea value={payload} readOnly rows={8} className="font-mono text-xs" />
        </div>
      </details>
    </div>
  );
}
