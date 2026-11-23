import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/utils";

export interface StatProps extends ComponentProps<"div"> {
  /** The number, already formatted for the locale ("1,200", "₹18,500"). */
  value: ReactNode;
  label: ReactNode;
  /**
   * Where the number comes from ("Ops data, Oct 2026"). Required: we only
   * publish numbers we can source. Shown as a footnote.
   */
  source: ReactNode;
}

/** A single sourced figure. Numbers over adjectives — but only real ones. */
export function Stat({ value, label, source, className, ...props }: StatProps) {
  return (
    <div data-slot="stat" className={cn("grid gap-1", className)} {...props}>
      <dt className="order-2 text-base font-medium text-muted-foreground">{label}</dt>
      <dd className="order-1 text-4xl font-extrabold tracking-tight text-foreground tabular-nums">
        {value}
      </dd>
      <dd className="order-3 text-xs text-muted-foreground">{source}</dd>
    </div>
  );
}

/** Wrap Stats in a StatGroup: a <dl>, so label/value pairs are announced together. */
export function StatGroup({ className, ...props }: ComponentProps<"dl">) {
  return (
    <dl
      data-slot="stat-group"
      className={cn("grid grid-cols-2 gap-6 md:grid-cols-4", className)}
      {...props}
    />
  );
}
