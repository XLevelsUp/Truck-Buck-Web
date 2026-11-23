"use client";

import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/utils";

export interface SegmentedOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps extends Omit<
  ComponentProps<typeof RadioGroupPrimitive.Root>,
  "children" | "orientation"
> {
  options: readonly SegmentedOption[];
  /** Accessible name when there is no visible label (`aria-labelledby` also works). */
  "aria-label"?: string;
  size?: "sm" | "md";
}

/**
 * 2–4 mutually exclusive choices shown side by side ("One-way | Return",
 * "Light | Dark"). A radio group underneath: arrow keys move, form-friendly
 * via `name`. For more than 4 options use Select.
 */
export function SegmentedControl({
  options,
  className,
  size = "md",
  ...props
}: SegmentedControlProps) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="segmented-control"
      orientation="horizontal"
      className={cn(
        "inline-flex w-full max-w-full rounded-lg border border-border-strong bg-surface-muted p-1 md:w-auto",
        className,
      )}
      {...props}
    >
      {options.map((option) => (
        <RadioGroupPrimitive.Item
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          className={cn(
            "flex-1 cursor-pointer rounded-md px-4 font-semibold whitespace-nowrap text-muted-foreground focus-ring transition-colors duration-fast hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-surface data-[state=checked]:text-foreground data-[state=checked]:shadow-sm md:flex-none",
            size === "sm" ? "min-h-9 text-sm" : "min-h-10 text-base",
          )}
        >
          {option.label}
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  );
}
