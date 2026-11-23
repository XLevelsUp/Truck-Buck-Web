"use client";

import { type ComponentProps, useState, useSyncExternalStore } from "react";
import { CalendarDays } from "lucide-react";

import { toISTDateKey } from "@truckbuck/utils";

import { cn } from "../lib/utils";
import { fieldControlVariants } from "./input";

/** `YYYY-MM-DD` + n days, calendar arithmetic in UTC so DST never applies. */
export function addDaysToKey(key: string, days: number): string {
  const date = new Date(`${key}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

const noopSubscribe = () => () => {};

/** Today's IST date, read on the client only (static pages are built days earlier). */
function useTodayIST(): string | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => toISTDateKey(Date.now()),
    () => null,
  );
}

export interface DatePickerProps extends Omit<
  ComponentProps<"input">,
  "type" | "value" | "defaultValue" | "onChange" | "size" | "min" | "max"
> {
  /** `YYYY-MM-DD`. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Earliest date. Default: today (IST). */
  min?: string;
  /** Latest date, or days ahead of today. Default: 90 days. */
  max?: string;
  maxDaysAhead?: number;
  /** Quick picks (i18n). Set to [] to hide. */
  quickPicks?: readonly { label: string; daysFromToday: number }[];
}

/**
 * Pickup-date field: one-tap "Today" / "Tomorrow" chips plus the native date
 * input. Native pickers are the most familiar and accessible option on
 * low-end Android, and cost zero JavaScript. Values are IST calendar dates.
 */
export function DatePicker({
  value: valueProp,
  defaultValue = "",
  onValueChange,
  min: minProp,
  max: maxProp,
  maxDaysAhead = 90,
  quickPicks = [
    { label: "Today", daysFromToday: 0 },
    { label: "Tomorrow", daysFromToday: 1 },
  ],
  className,
  disabled,
  ...props
}: DatePickerProps) {
  const today = useTodayIST();
  const [internal, setInternal] = useState(defaultValue);
  const value = valueProp ?? internal;
  const min = minProp ?? today ?? undefined;
  const max = maxProp ?? (today ? addDaysToKey(today, maxDaysAhead) : undefined);

  function change(next: string) {
    if (valueProp === undefined) setInternal(next);
    onValueChange?.(next);
  }

  return (
    <div data-slot="date-picker" className={cn("grid gap-2", className)}>
      {quickPicks.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {quickPicks.map((pick) => {
            const key = today ? addDaysToKey(today, pick.daysFromToday) : null;
            const pressed = key !== null && key === value;
            return (
              <button
                key={pick.label}
                type="button"
                disabled={disabled || key === null}
                aria-pressed={pressed}
                onClick={() => key && change(key)}
                className={cn(
                  "touch-target rounded-full border px-4 text-sm font-semibold focus-ring transition-colors duration-fast disabled:opacity-50",
                  pressed
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border-strong bg-surface text-surface-foreground hover:bg-surface-muted",
                )}
              >
                {pick.label}
              </button>
            );
          })}
        </div>
      ) : null}
      <div className="relative">
        <input
          type="date"
          value={value}
          min={min}
          max={max}
          disabled={disabled}
          onChange={(event) => change(event.target.value)}
          className={cn(
            fieldControlVariants(),
            "pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0",
          )}
          {...props}
        />
        <CalendarDays
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-muted-foreground"
        />
      </div>
    </div>
  );
}
