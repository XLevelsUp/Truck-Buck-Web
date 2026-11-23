import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "../lib/utils";
import { Spinner } from "./spinner";

export const buttonVariants = cva(
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap focus-ring transition-colors duration-fast ease-standard select-none disabled:cursor-not-allowed disabled:opacity-50 aria-busy:cursor-progress [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /** Brand blue. The default action in a view. */
        primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
        /** High-visibility amber. Conversion actions only (Get price, Apply). One per view. */
        cta: "border border-accent-border bg-accent text-accent-foreground hover:bg-accent-hover",
        /** Neutral outlined button for secondary actions. */
        secondary:
          "border border-border-strong bg-surface text-surface-foreground hover:bg-surface-muted",
        ghost: "text-foreground hover:bg-surface-muted",
        link: "text-link underline decoration-1 underline-offset-4 hover:decoration-2",
        danger: "bg-danger text-danger-foreground hover:opacity-90",
      },
      size: {
        sm: "h-9 px-3 text-sm [&_svg]:size-4",
        md: "h-11 px-5 text-base [&_svg]:size-5",
        lg: "h-13 px-6 text-lg [&_svg]:size-5",
        icon: "size-11 [&_svg]:size-5",
      },
      block: { true: "w-full" },
    },
    compoundVariants: [{ variant: "link", class: "h-auto px-0" }],
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

interface CommonProps extends ButtonVariantProps {
  className?: string;
}

export type ButtonProps =
  | (CommonProps &
      ComponentProps<"button"> & {
        asChild?: false;
        /** Shows a spinner, sets aria-busy and blocks clicks while keeping the label (no layout shift). */
        loading?: boolean;
      })
  | (CommonProps &
      ComponentProps<"button"> & {
        /** Render the child element (e.g. a link) with button styling instead of a <button>. */
        asChild: true;
        loading?: never;
      });

export function Button({
  className,
  variant,
  size,
  block,
  asChild = false,
  loading = false,
  children,
  disabled,
  onClick,
  type,
  ...props
}: ButtonProps) {
  if (asChild) {
    return (
      <Slot.Root
        data-slot="button"
        className={cn(buttonVariants({ variant, size, block }), className)}
        onClick={onClick}
        {...props}
      >
        {children}
      </Slot.Root>
    );
  }

  return (
    <button
      data-slot="button"
      className={cn(buttonVariants({ variant, size, block }), className)}
      disabled={disabled}
      aria-busy={loading || undefined}
      {...props}
      // While loading: not `disabled` (that drops focus and hides the busy
      // state from screen readers). Instead the click handler is detached and
      // a submit button becomes type="button", so a second tap can't resubmit.
      // No wrapper function, so Button stays a server-renderable component.
      type={loading ? "button" : (type ?? "button")}
      onClick={loading ? undefined : onClick}
    >
      {loading ? (
        <>
          {/* opacity, not visibility: the label must stay in the accessibility tree. */}
          <span className="inline-flex items-center gap-2 opacity-0">{children}</span>
          <span className="absolute inset-0 grid place-items-center">
            <Spinner />
          </span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
