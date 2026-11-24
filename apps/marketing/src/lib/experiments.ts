import { type Content, getContent } from "@/content";
import type { Locale } from "@/i18n/locales";

export type HeroPage = keyof Content["heroVariants"];
export type HeroVariant = "a" | "b" | "c";

/**
 * Live hero variant per page. "a" is the control. Phase 9 replaces this
 * constant with the A/B assignment (cookie or edge flag); pages don't change.
 */
export const activeHeroVariant: Record<HeroPage, HeroVariant> = {
  home: "a",
  shippers: "a",
  transporters: "a",
};

export interface HeroCopy {
  title: string;
  lead: string;
  cta: string;
  variant: HeroVariant;
}

/**
 * Hero headline, sub and CTA for a page. Variants exist in English only, so
 * other locales always get their translated control copy.
 */
export function heroCopy(page: HeroPage, locale: Locale = "en", variant?: HeroVariant): HeroCopy {
  const content = getContent(locale);
  if (locale === "en") {
    const chosen = variant ?? activeHeroVariant[page];
    return { ...content.heroVariants[page][chosen], variant: chosen };
  }
  const control =
    page === "home"
      ? { ...content.home.hero, cta: content.home.widget.submit }
      : {
          title: content[page].hero.title,
          lead: content[page].hero.lead,
          cta: content[page].hero.cta,
        };
  return { ...control, variant: "a" };
}
