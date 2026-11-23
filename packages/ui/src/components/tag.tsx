import { X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/utils";

const tagBase =
  "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-medium [&_svg]:size-4";

/** Static descriptive tag ("Open body", "GST invoice"). */
export function Tag({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="tag"
      className={cn(tagBase, "border-border bg-surface text-surface-foreground", className)}
      {...props}
    />
  );
}

export interface FilterTagProps extends Omit<ComponentProps<"button">, "type"> {
  pressed: boolean;
}

/** Toggleable filter chip (truck body type, city). Uses aria-pressed. */
export function FilterTag({ pressed, className, ...props }: FilterTagProps) {
  return (
    <button
      type="button"
      data-slot="filter-tag"
      aria-pressed={pressed}
      className={cn(
        tagBase,
        "cursor-pointer focus-ring transition-colors duration-fast",
        pressed
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border-strong bg-surface text-surface-foreground hover:bg-surface-muted",
        className,
      )}
      {...props}
    />
  );
}

export interface RemovableTagProps extends ComponentProps<"span"> {
  children: ReactNode;
  onRemove: () => void;
  /** Accessible label for the remove button, e.g. "Remove Chennai" (i18n). */
  removeLabel: string;
}

/** Selected value with a remove button (multi-select lanes, cities). */
export function RemovableTag({
  children,
  onRemove,
  removeLabel,
  className,
  ...props
}: RemovableTagProps) {
  return (
    <span
      data-slot="removable-tag"
      className={cn(
        tagBase,
        "border-border bg-primary-soft pr-1 text-primary-soft-foreground",
        className,
      )}
      {...props}
    >
      {children}
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        className="grid size-7 cursor-pointer place-items-center rounded-full focus-ring hover:bg-surface"
      >
        <X aria-hidden="true" />
      </button>
    </span>
  );
}
