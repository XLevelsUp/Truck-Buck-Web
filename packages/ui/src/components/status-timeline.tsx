import { Check } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/utils";

/**
 * Shipper-facing trip lifecycle, in display order. Deliberately simpler than
 * `BookingStatus` in @truckbuck/types: map API states onto these at the edge.
 */
export const tripStatuses = [
  "requested",
  "accepted",
  "driver_assigned",
  "in_transit",
  "delivered",
] as const;

export type TripStatus = (typeof tripStatuses)[number];

export const defaultTripStatusLabels: Record<TripStatus, string> = {
  requested: "Requested",
  accepted: "Accepted",
  driver_assigned: "Driver assigned",
  in_transit: "In transit",
  delivered: "Delivered",
};

export interface StatusTimelineProps extends Omit<ComponentProps<"ol">, "children"> {
  /** The latest status reached. */
  current: TripStatus;
  labels?: Record<TripStatus, string>;
  /** Optional detail per reached status, e.g. a formatted IST time or "Ramesh · TN 09 AB 1234". */
  details?: Partial<Record<TripStatus, ReactNode>>;
  /** "Vertical" for tracking pages; "horizontal" from md up for compact summaries. */
  orientation?: "vertical" | "responsive";
  completedLabel?: string;
  currentLabel?: string;
}

/** Requested → Accepted → Driver assigned → In transit → Delivered. */
export function StatusTimeline({
  current,
  labels = defaultTripStatusLabels,
  details,
  orientation = "vertical",
  completedLabel = "Completed",
  currentLabel = "Current status",
  className,
  ...props
}: StatusTimelineProps) {
  const currentIndex = tripStatuses.indexOf(current);
  const responsive = orientation === "responsive";
  return (
    <ol
      data-slot="status-timeline"
      className={cn("grid", responsive && "md:grid-cols-5", className)}
      {...props}
    >
      {tripStatuses.map((status, index) => {
        const state =
          index < currentIndex ? "done" : index === currentIndex ? "current" : "upcoming";
        const isLast = index === tripStatuses.length - 1;
        return (
          <li
            key={status}
            aria-current={state === "current" ? "step" : undefined}
            className={cn(
              "relative flex gap-3 pb-6 last:pb-0",
              responsive && "md:flex-col md:pb-0",
            )}
          >
            {!isLast ? (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-8 bottom-0 left-3.75 w-0.5",
                  responsive &&
                    "md:top-3.75 md:right-0 md:bottom-auto md:left-8 md:h-0.5 md:w-auto",
                  index < currentIndex ? "bg-primary" : "bg-border",
                )}
              />
            ) : null}
            <span
              aria-hidden="true"
              className={cn(
                "relative z-raised grid size-8 shrink-0 place-items-center rounded-full border-2",
                state === "done" && "border-primary bg-primary text-primary-foreground",
                state === "current" && "border-accent-border bg-accent text-accent-foreground",
                state === "upcoming" && "border-border-strong bg-surface",
              )}
            >
              {state === "done" ? (
                <Check className="size-4" />
              ) : state === "current" ? (
                <span className="size-2.5 rounded-full bg-accent-foreground" />
              ) : null}
            </span>
            <div className={cn("grid pt-1", responsive && "md:pr-2")}>
              <span
                className={cn(
                  "font-semibold",
                  state === "upcoming" ? "text-muted-foreground" : "text-foreground",
                )}
              >
                {labels[status]}
              </span>
              <span className="sr-only">
                {state === "done" ? completedLabel : state === "current" ? currentLabel : ""}
              </span>
              {details?.[status] && state !== "upcoming" ? (
                <span className="text-sm text-muted-foreground">{details[status]}</span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
