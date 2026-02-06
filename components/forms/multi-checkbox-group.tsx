"use client";

import * as React from "react";

import { Checkbox } from "@/components/ui/checkbox";

type MultiCheckboxGroupProps = {
  name: string;
  options: readonly string[];
  defaultValues?: string[];
  columns?: 1 | 2 | 3;
};

export function MultiCheckboxGroup({
  name,
  options,
  defaultValues,
  columns = 2,
}: MultiCheckboxGroupProps) {
  const [values, setValues] = React.useState<Set<string>>(
    new Set(defaultValues ?? [])
  );

  const gridClass =
    columns === 1
      ? "grid-cols-1"
      : columns === 3
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        : "grid-cols-1 sm:grid-cols-2";

  return (
    <div className={`grid gap-3 ${gridClass}`}>
      {options.map((option, index) => {
        const id = `${name}-${index}`;
        const checked = values.has(option);
        return (
          <label
            key={option}
            htmlFor={id}
            className="flex items-start gap-3 rounded-lg border border-border/70 bg-background px-3 py-2 text-sm"
          >
            <Checkbox
              id={id}
              checked={checked}
              onCheckedChange={(next) => {
                setValues((prev) => {
                  const updated = new Set(prev);
                  if (next) {
                    updated.add(option);
                  } else {
                    updated.delete(option);
                  }
                  return updated;
                });
              }}
              className="mt-0.5"
            />
            <span>{option}</span>
          </label>
        );
      })}
      {Array.from(values).map((value) => (
        <input key={value} type="hidden" name={name} value={value} />
      ))}
    </div>
  );
}
