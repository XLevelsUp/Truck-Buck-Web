/**
 * Site locales. English is the default and lives at unprefixed URLs
 * (/drivers). Translated pages live under a prefix (/hi/drivers,
 * /ta/drivers). Only pages listed in `localizedPaths` exist in hi/ta so far.
 */
export const locales = ["en", "hi", "ta"] as const;
export type Locale = (typeof locales)[number];

/** Locales served under /[locale]/… (everything except the default). */
export const prefixedLocales = ["hi", "ta"] as const;
export type PrefixedLocale = (typeof prefixedLocales)[number];

export const defaultLocale: Locale = "en";

export function isPrefixedLocale(value: string): value is PrefixedLocale {
  return (prefixedLocales as readonly string[]).includes(value);
}

/** BCP 47 tags for <html lang> and hreflang. */
export const htmlLang: Record<Locale, string> = { en: "en-IN", hi: "hi-IN", ta: "ta-IN" };

/** Open Graph locale codes. */
export const ogLocale: Record<Locale, string> = { en: "en_IN", hi: "hi_IN", ta: "ta_IN" };

/** Each language's own name, for the language switcher. */
export const localeNames: Record<Locale, string> = { en: "English", hi: "हिन्दी", ta: "தமிழ்" };

/** Pages that exist in every locale (path without prefix). */
export const localizedPaths = ["/", "/drivers", "/transporters"] as const;
export type LocalizedPath = (typeof localizedPaths)[number];

export function isLocalizedPath(path: string): path is LocalizedPath {
  return (localizedPaths as readonly string[]).includes(path);
}

export function localizedHref(locale: Locale, path: `/${string}`): `/${string}` {
  if (locale === defaultLocale) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/**
 * Native-speaker review status (Phase 5 rule: no machine translation ships
 * unreviewed). Flip `reviewed` to true — and fill in who reviewed it — only
 * after a native speaker has signed off. Until then the locale is served
 * only on dev/preview builds (see publishedLocales in ./publishing.ts).
 */
export const translationReview: Record<
  PrefixedLocale,
  { reviewed: boolean; reviewer: string | null }
> = {
  hi: { reviewed: false, reviewer: null }, // TODO(NFC-22): native Hindi review
  ta: { reviewed: false, reviewer: null }, // TODO(NFC-22): native Tamil review
};

/** Cookie remembering the visitor's language choice (set by the switcher). */
export const LOCALE_COOKIE = "tb_locale";
