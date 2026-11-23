import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/utils";

export interface TruckSpec {
  label: string;
  value: string;
}

export interface TruckCardProps extends Omit<ComponentProps<"article">, "title"> {
  name: string;
  /** Truck-class icon (from truck-icons) or a 4:3 photo/render. Decorative. */
  media: ReactNode;
  /** "Good for: FMCG cartons, furniture". */
  summary?: ReactNode;
  /** From the `truck_types` table — never typed into copy. 2–4 specs. */
  specs: readonly TruckSpec[];
  badge?: ReactNode;
  /** One action, usually "Get price for this truck". */
  action?: ReactNode;
  headingLevel?: 2 | 3 | 4;
}

/** A truck type in the catalogue or the fare widget's picker. */
export function TruckCard({
  name,
  media,
  summary,
  specs,
  badge,
  action,
  headingLevel = 3,
  className,
  ...props
}: TruckCardProps) {
  const Heading = `h${headingLevel}` as const;
  return (
    <article
      data-slot="truck-card"
      className={cn(
        "flex flex-col gap-4 rounded-xl border bg-surface p-5 text-surface-foreground transition-shadow duration-base hover:shadow-md",
        className,
      )}
      {...props}
    >
      <div
        aria-hidden="true"
        className="grid aspect-[4/3] place-items-center overflow-hidden rounded-lg bg-primary-soft text-primary-soft-foreground [&>svg]:size-20"
      >
        {media}
      </div>
      <div className="flex items-start justify-between gap-3">
        <Heading className="text-xl leading-tight font-bold">{name}</Heading>
        {badge}
      </div>
      {summary ? <p className="text-muted-foreground">{summary}</p> : null}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-4">
        {specs.map((spec) => (
          <div key={spec.label} className="grid">
            <dt className="text-sm text-muted-foreground">{spec.label}</dt>
            <dd className="font-semibold tabular-nums">{spec.value}</dd>
          </div>
        ))}
      </dl>
      {action ? <div className="mt-auto pt-1">{action}</div> : null}
    </article>
  );
}
