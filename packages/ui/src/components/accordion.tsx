import { ChevronDown } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/utils";

/**
 * Accordion built on native <details>/<summary> rather than Radix: zero
 * JavaScript, works before hydration, keyboard and screen-reader support from
 * the browser, and answers stay in the HTML (find-in-page and FAQ rich
 * results can see them). Give items the same `name` to allow only one open.
 */
export function Accordion({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="accordion"
      className={cn("divide-y divide-border border-y border-border", className)}
      {...props}
    />
  );
}

export interface AccordionItemProps extends Omit<ComponentProps<"details">, "title"> {
  title: ReactNode;
  /** Heading level wrapping the question, for document outline. Default h3. */
  headingLevel?: 2 | 3 | 4;
}

export function AccordionItem({
  title,
  headingLevel = 3,
  className,
  children,
  ...props
}: AccordionItemProps) {
  const Heading = `h${headingLevel}` as const;
  return (
    <details data-slot="accordion-item" className={cn("group", className)} {...props}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-md py-3 text-left focus-ring [&::-webkit-details-marker]:hidden">
        <Heading className="text-lg font-semibold">{title}</Heading>
        <ChevronDown
          aria-hidden="true"
          className="size-5 shrink-0 text-muted-foreground transition-transform duration-base group-open:rotate-180"
        />
      </summary>
      <div className="pb-5 text-base leading-7 text-muted-foreground">{children}</div>
    </details>
  );
}
