import type { Metadata } from "next";

import { BrandSection } from "./_components/brand-section";
import {
  ActionsSection,
  DisplaySection,
  DomainSection,
  FormSection,
  OverlaySection,
} from "./_components/component-sections";
import { ThemeSwitcher } from "./_components/theme-switcher";
import { ColorSection, LayoutTokensSection, TypographySection } from "./_components/token-sections";

/*
 * Internal reference for designers and engineers. English-only by design
 * (not part of the translated site), excluded from the sitemap and noindex.
 */
export const metadata: Metadata = {
  title: "Styleguide",
  description: "TruckBuck design tokens and components.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/styleguide" },
};

const toc = [
  { id: "color", label: "Colour" },
  { id: "type", label: "Typography" },
  { id: "space", label: "Space and motion" },
  { id: "brand", label: "Logo and icons" },
  { id: "actions", label: "Actions" },
  { id: "forms", label: "Forms" },
  { id: "display", label: "Content" },
  { id: "overlays", label: "Overlays" },
  { id: "domain", label: "TruckBuck" },
] as const;

export default function StyleguidePage() {
  return (
    <div className="mx-auto max-w-(--container-content) page-gutter py-10">
      <header className="grid gap-4">
        <p className="text-sm font-semibold tracking-wide text-link uppercase">Design system</p>
        <h1 className="text-5xl font-extrabold">Styleguide</h1>
        <p className="max-w-prose text-lg text-muted-foreground">
          Reliable infrastructure, consumer-simple. Every token and component from{" "}
          <code className="font-mono">@truckbuck/ui</code>, in the current theme.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <ThemeSwitcher />
        </div>
        <nav aria-label="Styleguide sections">
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {toc.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="text-link underline underline-offset-4 hover:decoration-2"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <ColorSection />
      <TypographySection />
      <LayoutTokensSection />
      <BrandSection />
      <ActionsSection />
      <FormSection />
      <DisplaySection />
      <OverlaySection />
      <DomainSection />
    </div>
  );
}
