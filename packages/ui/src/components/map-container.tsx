import { MapPin } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/utils";

export interface MapContainerProps extends Omit<ComponentProps<"figure">, "children"> {
  /** What the map shows, for screen readers: "Route from Chennai to Bengaluru, 346 km". */
  label: string;
  /** The map itself, once loaded (lazy). Until then the placeholder shows. */
  children?: ReactNode;
  /** Text fallback shown in the placeholder (e.g. the route as text). */
  placeholder?: ReactNode;
  ratio?: "16/9" | "4/3" | "1/1";
  /** Shows a loading state over the placeholder. */
  loading?: boolean;
}

/**
 * Fixed-ratio frame for a route map. Reserves space before the map loads
 * (no layout shift), shows a static placeholder instead of loading Maps JS
 * on page load, and always carries a text description — the map is never
 * the only way to read the route.
 */
export function MapContainer({
  label,
  children,
  placeholder,
  ratio = "16/9",
  loading = false,
  className,
  ...props
}: MapContainerProps) {
  return (
    <figure
      data-slot="map-container"
      aria-label={label}
      aria-busy={loading || undefined}
      className={cn(
        "relative w-full overflow-hidden rounded-xl border bg-surface-muted",
        ratio === "16/9" && "aspect-video",
        ratio === "4/3" && "aspect-[4/3]",
        ratio === "1/1" && "aspect-square",
        className,
      )}
      {...props}
    >
      {children ?? (
        <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] bg-size-[16px_16px] p-6 text-center">
          <div className="grid justify-items-center gap-2 text-muted-foreground">
            <MapPin aria-hidden="true" className={cn("size-8", loading && "animate-pulse")} />
            {placeholder ? <div className="text-sm font-medium">{placeholder}</div> : null}
          </div>
        </div>
      )}
    </figure>
  );
}
