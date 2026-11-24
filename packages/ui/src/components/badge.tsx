import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "../lib/utils";

/**
 * Non-interactive status label ("Verified", "In transit", "New").
 * Never rely on colour alone: the text must carry the meaning.
 */
export const badgeVariants = cva(
  "inline-flex w-fit max-w-full shrink-0 items-center gap-1 rounded-2xl px-2.5 py-0.5 text-xs leading-5 font-semibold [&_svg]:size-3.5",
  {
    variants: {
      variant: {
        neutral: "bg-surface-muted text-foreground ring-1 ring-border ring-inset",
        brand: "bg-primary-soft text-primary-soft-foreground",
        success: "bg-success-soft text-success-soft-foreground",
        warning: "bg-warning-soft text-warning-soft-foreground",
        danger: "bg-danger-soft text-danger-soft-foreground",
        info: "bg-info-soft text-info-soft-foreground",
        /** Solid amber: reserve for "New" / promo moments. */
        accent: "bg-accent text-accent-foreground",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps extends ComponentProps<"span">, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
