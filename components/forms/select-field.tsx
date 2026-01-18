"use client";

import * as React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SelectFieldProps = {
  name: string;
  options: readonly string[];
  placeholder?: string;
  defaultValue?: string;
};

export function SelectField({
  name,
  options,
  placeholder,
  defaultValue,
}: SelectFieldProps) {
  const [value, setValue] = React.useState(defaultValue ?? "");

  return (
    <>
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <input type="hidden" name={name} value={value} />
    </>
  );
}
