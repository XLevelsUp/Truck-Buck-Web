import type { ComponentProps } from "react";

import { cn } from "../lib/utils";

/**
 * Decorative loading indicator. Announce loading state on the owning element
 * (`aria-busy`, or a visually hidden label) — the spinner itself is hidden
 * from assistive tech.
 */
export function Spinner({ className, ...props }: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      data-slot="spinner"
      className={cn("size-4 animate-spin", className)}
      {...props}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
