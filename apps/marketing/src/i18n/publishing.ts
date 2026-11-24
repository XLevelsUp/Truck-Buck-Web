import { type Locale, locales, translationReview } from "./locales";

/**
 * Whether unreviewed translations may be served. On for `next dev`; for
 * production builds only with PREVIEW_UNREVIEWED_LOCALES=true (set it on
 * Vercel Preview so reviewers can read the drafts — never on Production).
 */
function previewUnreviewed(): boolean {
  const flag = process.env.PREVIEW_UNREVIEWED_LOCALES;
  if (flag !== undefined && flag !== "") return flag === "true";
  return process.env.NODE_ENV !== "production";
}

export function isLocalePublished(locale: Locale): boolean {
  if (locale === "en") return true;
  return translationReview[locale].reviewed || previewUnreviewed();
}

/** Locales a visitor can reach in this build (English always first). Drives routing and the switcher. */
export function publishedLocales(): Locale[] {
  return locales.filter(isLocalePublished);
}

/**
 * Locales search engines may index: reviewed translations only, in every
 * build. Drives hreflang and the sitemap. A preview build can serve drafts,
 * but they stay noindex and never appear as alternates.
 */
export function isLocaleIndexable(locale: Locale): boolean {
  return locale === "en" || translationReview[locale].reviewed;
}

export function indexableLocales(): Locale[] {
  return locales.filter(isLocaleIndexable);
}
