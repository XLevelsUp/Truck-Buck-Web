import type { ComponentProps, ReactNode } from "react";

import { formatINR } from "@truckbuck/utils";

import { cn } from "../lib/utils";

export interface PriceBreakdownRowProps extends Omit<ComponentProps<"div">, "children"> {
  label: ReactNode;
  /** Integer paise (money is never a float). Omit with `valueText` for "Included" / "At actuals". */
  amountPaise?: number;
  /** Shown instead of an amount, e.g. "Included", "At actuals". */
  valueText?: ReactNode;
  /** Small print under the label, e.g. "Paid directly at toll plazas". */
  note?: ReactNode;
  /** `total` is bold with a rule above; `discount` shows a minus sign. */
  kind?: "line" | "discount" | "total";
}

/**
 * One row of a fare breakdown. Wrap rows in <PriceBreakdown> (a <dl>).
 * Amounts use Indian grouping (₹1,23,456).
 */
export function PriceBreakdownRow({
  label,
  amountPaise,
  valueText,
  note,
  kind = "line",
  className,
  ...props
}: PriceBreakdownRowProps) {
  const amount =
    amountPaise === undefined
      ? valueText
      : `${kind === "discount" ? "− " : ""}${formatINR(amountPaise, { wholeRupees: true })}`;
  return (
    <div
      data-slot="price-breakdown-row"
      className={cn(
        "flex items-start justify-between gap-4 py-2",
        kind === "total" && "mt-2 border-t-2 border-foreground pt-3",
        className,
      )}
      {...props}
    >
      <dt className="grid">
        <span className={cn(kind === "total" ? "text-lg font-bold" : "text-base")}>{label}</span>
        {note ? <span className="text-sm text-muted-foreground">{note}</span> : null}
      </dt>
      <dd
        className={cn(
          "shrink-0 text-right tabular-nums",
          kind === "total" ? "text-2xl font-extrabold" : "font-semibold",
          kind === "discount" && "text-success",
        )}
      >
        {amount}
      </dd>
    </div>
  );
}

export function PriceBreakdown({ className, ...props }: ComponentProps<"dl">) {
  return <dl data-slot="price-breakdown" className={cn("grid", className)} {...props} />;
}
