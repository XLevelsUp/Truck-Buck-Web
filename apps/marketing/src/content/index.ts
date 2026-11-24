import type { Locale } from "@/i18n/locales";

import { en } from "./en";
import { hi } from "./hi";
import { ta } from "./ta";
import type { Content } from "./types";

export type { Content, Translation } from "./types";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function merge<T>(base: T, override: unknown): T {
  if (!isObject(base) || !isObject(override)) return (override ?? base) as T;
  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value !== undefined) result[key] = merge(base[key], value);
  }
  return result as T;
}

const dictionaries: Record<Locale, Content> = {
  en,
  hi: merge<Content>(en, hi),
  ta: merge<Content>(en, ta),
};

/**
 * Single entry point for copy. Untranslated keys fall back to English, so a
 * partly translated locale still renders every page.
 */
export function getContent(locale: Locale = "en"): Content {
  return dictionaries[locale];
}
