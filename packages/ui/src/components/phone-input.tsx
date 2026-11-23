"use client";

import { type ChangeEvent, type ComponentProps, useState } from "react";

import { normalizeIndianMobile } from "@truckbuck/utils";

import { cn } from "../lib/utils";
import { fieldControlVariants } from "./input";

/** Strips everything but digits and drops a pasted +91 / 0091 / 91 / 0 prefix. */
export function toNationalDigits(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length > 10) {
    const e164 = normalizeIndianMobile(input);
    if (e164) return e164.slice(3);
  }
  return digits.slice(0, 10);
}

/** `9876543210` → `98765 43210` (the way people read numbers aloud). */
export function formatNational(digits: string): string {
  return digits.length > 5 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits;
}

export interface PhoneInputProps extends Omit<
  ComponentProps<"input">,
  "type" | "value" | "defaultValue" | "onChange" | "size"
> {
  value?: string;
  defaultValue?: string;
  /** Called on every change with the national digits and the E.164 number (null until valid). */
  onValueChange?: (value: { national: string; e164: string | null }) => void;
  /** Country code shown before the input. Visual only; screen readers hear it via the label. */
  prefix?: string;
}

/**
 * Indian mobile number input with a fixed +91 prefix. Submits what the user
 * typed (it works without JavaScript); the server normalises with
 * `normalizeIndianMobile` from @truckbuck/utils. Opens the numeric keypad.
 */
export function PhoneInput({
  className,
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onBlur,
  prefix = "+91",
  ...props
}: PhoneInputProps) {
  const [internal, setInternal] = useState(() => formatNational(toNationalDigits(defaultValue)));
  const value = valueProp === undefined ? internal : formatNational(toNationalDigits(valueProp));

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const national = toNationalDigits(event.target.value);
    setInternal(formatNational(national));
    onValueChange?.({ national, e164: normalizeIndianMobile(national) });
  }

  return (
    <div
      data-slot="phone-input"
      className={cn(
        fieldControlVariants(),
        "flex items-center gap-2 px-0 focus-within:border-ring focus-within:shadow-[0_0_0_1px_var(--color-ring)] has-aria-invalid:border-danger",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex h-full items-center border-r border-border pr-2 pl-3 font-medium text-muted-foreground"
      >
        {prefix}
      </span>
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="98765 43210"
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        className="h-full min-w-0 flex-1 bg-transparent pr-3 text-base outline-none placeholder:text-muted-foreground"
        {...props}
      />
    </div>
  );
}
