import type { MetadataRoute } from "next";

/**
 * Every public route, in one place. Drives the sitemap and navigation, so a
 * new page that is missing here will not be indexed — add it here first.
 * Paths are locale-agnostic; an i18n prefix can be applied in one helper later.
 */
export const routes = {
  home: { path: "/", changeFrequency: "weekly", priority: 1, lastModified: "2026-10-31" },
  privacy: {
    path: "/privacy",
    changeFrequency: "yearly",
    priority: 0.3,
    lastModified: "2026-10-31",
  },
  terms: { path: "/terms", changeFrequency: "yearly", priority: 0.3, lastModified: "2026-10-31" },
} as const satisfies Record<
  string,
  {
    path: `/${string}`;
    changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
    priority: number;
    lastModified: string;
  }
>;

export type RouteKey = keyof typeof routes;
