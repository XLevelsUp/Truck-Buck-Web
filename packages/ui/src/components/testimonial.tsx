import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/utils";

export interface TestimonialProps extends Omit<ComponentProps<"figure">, "children"> {
  quote: ReactNode;
  name: string;
  /** "Logistics manager" */
  role?: string;
  company?: string;
  /** Real, consented photo only. Decorative (the name is already in text). */
  avatar?: ReactNode;
}

/**
 * Customer quote. Only real quotes with written consent on file — the data
 * layer filters on `consent_on_file`; never fill this with sample copy in
 * production.
 */
export function Testimonial({
  quote,
  name,
  role,
  company,
  avatar,
  className,
  ...props
}: TestimonialProps) {
  const byline = [role, company].filter(Boolean).join(", ");
  return (
    <figure
      data-slot="testimonial"
      className={cn("flex flex-col gap-5 rounded-xl border bg-surface p-6", className)}
      {...props}
    >
      <blockquote className="text-lg leading-8 text-surface-foreground">
        <p>
          <span aria-hidden="true" className="mr-0.5 font-bold text-primary">
            “
          </span>
          {quote}
          <span aria-hidden="true" className="ml-0.5 font-bold text-primary">
            ”
          </span>
        </p>
      </blockquote>
      <figcaption className="mt-auto flex items-center gap-3">
        {avatar ? (
          <span aria-hidden="true" className="size-11 shrink-0 overflow-hidden rounded-full">
            {avatar}
          </span>
        ) : null}
        <span className="grid">
          <span className="font-semibold">{name}</span>
          {byline ? <span className="text-sm text-muted-foreground">{byline}</span> : null}
        </span>
      </figcaption>
    </figure>
  );
}
