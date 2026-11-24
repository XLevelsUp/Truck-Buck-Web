import type { MetadataRoute } from "next";

import { helpFaqs } from "@/content/help";
import { env } from "@/env";
import { htmlLang, localizedHref, localizedPaths, prefixedLocales } from "@/i18n/locales";
import { indexableLocales, isLocaleIndexable } from "@/i18n/publishing";
import { routes } from "@/lib/routes";
import { getCatalog } from "@/server/catalog";

const absolute = (path: string) => `${env.NEXT_PUBLIC_SITE_URL}${path === "/" ? "" : path}`;

/** hreflang alternates for a page that exists in every locale. */
function languages(path: `/${string}`) {
  return Object.fromEntries(
    indexableLocales().map((l) => [htmlLang[l], absolute(localizedHref(l, path))]),
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const isLocalized = (path: string) => (localizedPaths as readonly string[]).includes(path);

  // Unreviewed translations are never listed (see translationReview).
  const pages: MetadataRoute.Sitemap = Object.values(routes).map((route) => ({
    url: absolute(route.path),
    lastModified: route.lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    ...(isLocalized(route.path) ? { alternates: { languages: languages(route.path) } } : {}),
  }));

  const translated: MetadataRoute.Sitemap = localizedPaths.flatMap((path) =>
    prefixedLocales.filter(isLocaleIndexable).map((locale) => ({
      url: absolute(localizedHref(locale, path)),
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: { languages: languages(path) },
    })),
  );

  // Sample trucks are noindex, so they stay out of the sitemap.
  const { trucks } = await getCatalog();
  const truckPages: MetadataRoute.Sitemap = trucks
    .filter((truck) => !truck.isSample)
    .map((truck) => ({
      url: absolute(`/trucks/${truck.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  const helpPages: MetadataRoute.Sitemap = helpFaqs().map((faq) => ({
    url: absolute(`/help/${faq.slug}`),
    changeFrequency: "monthly" as const,
    priority: 0.4,
  }));

  return [...pages, ...translated, ...truckPages, ...helpPages];
}
