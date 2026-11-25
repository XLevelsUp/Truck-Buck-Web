"use client";

import type { ComponentType } from "react";

import { cn } from "@truckbuck/ui/lib/utils";
import {
  ContainerTruckIcon,
  LcvIcon,
  McvIcon,
  MiniTruckIcon,
  OpenBodyIcon,
  PickupIcon,
  ReeferTruckIcon,
  TrailerIcon,
  type TruckIconProps,
} from "@truckbuck/ui/truck-icons";

import { fill, trimNumber } from "@/lib/format";

import type { WidgetTruck } from "./labels";

const icons: Record<string, ComponentType<TruckIconProps>> = {
  mini: MiniTruckIcon,
  pickup: PickupIcon,
  lcv: LcvIcon,
  mcv: McvIcon,
  container: ContainerTruckIcon,
  open: OpenBodyIcon,
  trailer: TrailerIcon,
  reefer: ReeferTruckIcon,
};

interface TruckPickerProps {
  trucks: WidgetTruck[];
  value: string | null;
  onChange: (slug: string) => void;
  legend: string;
  specTemplate: string;
  error?: string | undefined;
  errorId: string;
}

/**
 * Chip picker built on native radio buttons: arrow keys, form semantics and
 * screen-reader support for free. Scrolls sideways on narrow screens.
 */
export function TruckPicker({
  trucks,
  value,
  onChange,
  legend,
  specTemplate,
  error,
  errorId,
}: TruckPickerProps) {
  return (
    <fieldset
      className="grid min-w-0 gap-1.5"
      aria-describedby={error ? errorId : undefined}
      aria-invalid={error ? true : undefined}
    >
      <legend className="mb-1.5 text-sm font-semibold">{legend}</legend>
      <div className="-mx-4 flex snap-x [scrollbar-width:thin] gap-2 overflow-x-auto px-4 pb-1 md:-mx-0 md:flex-wrap md:px-0">
        {trucks.map((truck) => {
          const Icon = icons[truck.iconKey] ?? LcvIcon;
          const checked = value === truck.slug;
          return (
            <label
              key={truck.slug}
              className={cn(
                "relative flex min-h-14 shrink-0 cursor-pointer snap-start items-center gap-2.5 rounded-xl border px-3 py-2 transition-colors duration-fast has-focus-visible:shadow-[0_0_0_2px_var(--color-background),0_0_0_4px_var(--color-ring)]",
                checked
                  ? "border-primary bg-primary-soft text-primary-soft-foreground"
                  : "border-border-strong bg-surface hover:bg-surface-muted",
              )}
            >
              <input
                type="radio"
                name="truck"
                value={truck.slug}
                checked={checked}
                onChange={() => onChange(truck.slug)}
                className="sr-only"
              />
              <Icon size={28} />
              <span className="grid leading-tight">
                <span className="font-semibold whitespace-nowrap">{truck.name}</span>
                <span
                  className={cn(
                    "text-sm whitespace-nowrap",
                    checked ? "text-primary-soft-foreground" : "text-muted-foreground",
                  )}
                >
                  {fill(specTemplate, {
                    tonnes: trimNumber(truck.payloadTonnes),
                    feet: trimNumber(truck.lengthFt),
                  })}
                </span>
              </span>
            </label>
          );
        })}
      </div>
      {/* Live region always present (display: contents, so no layout box) so the
          error is announced as it appears, not only when focus reaches the field. */}
      <div aria-live="polite" aria-atomic="true" className="contents">
        {error ? (
          <p id={errorId} className="text-sm font-medium text-danger">
            {error}
          </p>
        ) : null}
      </div>
    </fieldset>
  );
}
