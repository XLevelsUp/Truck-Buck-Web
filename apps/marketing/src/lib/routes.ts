import type { MetadataRoute } from "next";

import { type Locale, localizedHref } from "@/i18n/locales";

/**
 * Every public route, in one place. Drives the sitemap and navigation, so a
 * new page that is missing here will not be indexed — add it here first.
 * Paths are unprefixed (English); translated variants come from
 * `localizedPaths` in src/i18n/locales.ts.
 */
type RouteEntry = {
  path: `/${string}`;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
  lastModified: string;
};

export const routes = {
  home: { path: "/", changeFrequency: "weekly", priority: 1, lastModified: "2026-11-24" },
  shippers: {
    path: "/shippers",
    changeFrequency: "monthly",
    priority: 0.9,
    lastModified: "2026-11-24",
  },
  transporters: {
    path: "/transporters",
    changeFrequency: "monthly",
    priority: 0.9,
    lastModified: "2026-11-24",
  },
  drivers: {
    path: "/drivers",
    changeFrequency: "monthly",
    priority: 0.7,
    lastModified: "2026-11-24",
  },
  trucks: { path: "/trucks", changeFrequency: "weekly", priority: 0.8, lastModified: "2026-11-24" },
  pricing: {
    path: "/pricing",
    changeFrequency: "monthly",
    priority: 0.8,
    lastModified: "2026-11-24",
  },
  howItWorks: {
    path: "/how-it-works",
    changeFrequency: "monthly",
    priority: 0.7,
    lastModified: "2026-11-24",
  },
  privacy: {
    path: "/privacy",
    changeFrequency: "yearly",
    priority: 0.3,
    lastModified: "2026-10-31",
  },
  terms: { path: "/terms", changeFrequency: "yearly", priority: 0.3, lastModified: "2026-10-31" },
} as const satisfies Record<string, RouteEntry>;

export type RouteKey = keyof typeof routes;

/** The fare widget's anchor on the home page. Becomes /book when the web app ships. */
export const getPriceHref = "/#get-price";

/** Header navigation. Help points at the home FAQ until /help ships (blueprint Phase 8). */
export const primaryNav = [
  { key: "shippers", href: routes.shippers.path },
  { key: "transporters", href: routes.transporters.path },
  { key: "drivers", href: routes.drivers.path },
  { key: "pricing", href: routes.pricing.path },
  { key: "help", href: "/#faq" },
] as const;

/** The fare widget's anchor on the home page in a given language. */
export function getPriceHrefFor(locale: Locale): string {
  return `${localizedHref(locale, routes.home.path)}#get-price`;
}
