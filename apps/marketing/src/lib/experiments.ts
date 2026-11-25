import { type Content, getContent } from "@/content";
import type { Locale } from "@/i18n/locales";

import { type Assignment, CONTROL } from "./ab";

export * from "./ab";

/* ------------------------------------------------------------------------ */
/* Copy for the hero experiment                                             */
/* ------------------------------------------------------------------------ */

export type HeroPage = keyof Content["heroVariants"];
export type HeroVariant = Assignment["hero"];

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
export function heroCopy(
  page: HeroPage,
  locale: Locale = "en",
  variant: HeroVariant = CONTROL.hero,
): HeroCopy {
  const content = getContent(locale);
  if (locale === "en") {
    return { ...content.heroVariants[page][variant], variant };
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
