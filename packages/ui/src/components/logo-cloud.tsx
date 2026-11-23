import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/utils";

export interface LogoCloudItem {
  /** Company name: used as the accessible name of the logo. */
  name: string;
  /** The logo (an <img>/<Image> with alt="" or an inline SVG). */
  logo: ReactNode;
}

export interface LogoCloudProps extends Omit<ComponentProps<"section">, "title"> {
  title: ReactNode;
  logos: readonly LogoCloudItem[];
  headingLevel?: 2 | 3 | 4;
}

/**
 * Client logos, shown only with written permission. Monochrome by default
 * so no single brand shouts; renders nothing when the list is empty.
 */
export function LogoCloud({ title, logos, headingLevel = 2, className, ...props }: LogoCloudProps) {
  if (logos.length === 0) return null;
  const Heading = `h${headingLevel}` as const;
  return (
    <section data-slot="logo-cloud" className={cn("grid gap-6", className)} {...props}>
      <Heading className="text-center text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </Heading>
      <ul className="grid grid-cols-2 items-center gap-x-6 gap-y-8 md:grid-cols-3 lg:grid-cols-6">
        {logos.map(({ name, logo }) => (
          <li
            key={name}
            className="flex h-10 items-center justify-center text-muted-foreground grayscale transition duration-base hover:grayscale-0 [&_img]:max-h-10 [&_img]:w-auto [&_svg]:max-h-10"
          >
            <span className="sr-only">{name}</span>
            {logo}
          </li>
        ))}
      </ul>
    </section>
  );
}
