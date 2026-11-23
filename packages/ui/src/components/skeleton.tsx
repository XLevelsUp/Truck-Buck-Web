import type { ComponentProps } from "react";

import { cn } from "../lib/utils";

/**
 * Placeholder with the exact size of the content it stands in for, so
 * nothing shifts when data arrives (CLS). Decorative: put `aria-busy` on the
 * region that is loading.
 */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      data-slot="skeleton"
      className={cn(
        "animate-shimmer rounded-md bg-[linear-gradient(90deg,var(--color-surface-muted)_25%,var(--color-border)_50%,var(--color-surface-muted)_75%)] bg-size-[200%_100%]",
        className,
      )}
      {...props}
    />
  );
}
