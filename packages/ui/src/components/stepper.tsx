import { Check } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "../lib/utils";

export interface StepperProps extends Omit<ComponentProps<"ol">, "children"> {
  steps: readonly string[];
  /** Zero-based index of the current step. */
  current: number;
  /** Screen-reader text, e.g. (i, n) => `Step ${i} of ${n}` (i18n). */
  stepLabel?: (index: number, total: number) => string;
  completedLabel?: string;
}

/**
 * Progress through a multi-step form (transporter application, enquiry).
 * The current step has aria-current="step"; numbers are shown on mobile and
 * labels from md up, so 3–4 steps fit in 360px.
 */
export function Stepper({
  steps,
  current,
  stepLabel = (index, total) => `Step ${index} of ${total}`,
  completedLabel = "completed",
  className,
  ...props
}: StepperProps) {
  return (
    <ol data-slot="stepper" className={cn("flex items-center gap-2", className)} {...props}>
      {steps.map((label, index) => {
        const state = index < current ? "done" : index === current ? "current" : "upcoming";
        return (
          <li
            key={label}
            aria-current={state === "current" ? "step" : undefined}
            className="flex flex-1 items-center gap-2 last:flex-none"
          >
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-full border-2 text-sm font-bold",
                state === "done" && "border-primary bg-primary text-primary-foreground",
                state === "current" && "border-primary bg-surface text-primary",
                state === "upcoming" && "border-border-strong bg-surface text-muted-foreground",
              )}
            >
              {state === "done" ? <Check aria-hidden="true" className="size-4" /> : index + 1}
            </span>
            <span
              className={cn(
                "hidden text-sm font-semibold md:inline",
                state === "upcoming" ? "text-muted-foreground" : "text-foreground",
              )}
            >
              {label}
            </span>
            <span className="sr-only">
              {`${stepLabel(index + 1, steps.length)}: ${label}${state === "done" ? `, ${completedLabel}` : ""}`}
            </span>
            {index < steps.length - 1 ? (
              <span
                aria-hidden="true"
                className={cn(
                  "h-0.5 min-w-4 flex-1 rounded-full",
                  index < current ? "bg-primary" : "bg-border",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
