import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/utils";

export interface EmptyStateProps extends Omit<ComponentProps<"div">, "title"> {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** The one thing the user can do next (a Button or link). */
  action?: ReactNode;
  headingLevel?: 2 | 3 | 4;
}

/** What to show when there is nothing to show — always with a way forward. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  headingLevel = 3,
  className,
  ...props
}: EmptyStateProps) {
  const Heading = `h${headingLevel}` as const;
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-strong px-6 py-10 text-center",
        className,
      )}
      {...props}
    >
      {icon ? (
        <span
          aria-hidden="true"
          className="grid size-14 place-items-center rounded-full bg-primary-soft text-primary-soft-foreground [&_svg]:size-7"
        >
          {icon}
        </span>
      ) : null}
      <Heading className="text-xl font-bold">{title}</Heading>
      {description ? <p className="max-w-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
