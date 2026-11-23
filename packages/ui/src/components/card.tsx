import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "../lib/utils";

export const cardVariants = cva("flex flex-col gap-4 rounded-xl text-surface-foreground", {
  variants: {
    variant: {
      /** Default: white surface, hairline border. */
      outline: "border bg-surface",
      /** Lifted: for things you can act on (truck options, price result). */
      raised: "border bg-surface shadow-md",
      /** Muted fill, no border: secondary groupings. */
      muted: "bg-surface-muted",
      /** Brand band: hero cards, final CTA. */
      brand: "bg-surface-brand text-surface-brand-foreground",
    },
    padding: {
      none: "",
      md: "p-5",
      lg: "p-6 md:p-8",
    },
    interactive: {
      true: "transition-[box-shadow,border-color] duration-base hover:border-border-strong hover:shadow-lg has-[a:focus-visible]:shadow-[0_0_0_2px_var(--color-ring)]",
    },
  },
  defaultVariants: { variant: "outline", padding: "md" },
});

export interface CardProps extends ComponentProps<"div">, VariantProps<typeof cardVariants> {}

export function Card({ className, variant, padding, interactive, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant, padding, interactive }), className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("grid gap-1.5", className)} {...props} />;
}

export function CardTitle({
  className,
  as: Heading = "h3",
  ...props
}: ComponentProps<"h3"> & { as?: "h2" | "h3" | "h4" }) {
  return (
    <Heading
      data-slot="card-title"
      className={cn("text-xl leading-tight font-bold", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-base text-muted-foreground", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("grid gap-3", className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("mt-auto flex flex-wrap items-center gap-3", className)}
      {...props}
    />
  );
}
