import type { MetadataRoute } from "next";

import { helpFaqs } from "@/content/help";
import { env } from "@/env";
import { htmlLang, localizedHref, localizedPaths, prefixedLocales } from "@/i18n/locales";
import { indexableLocales, isLocaleIndexable } from "@/i18n/publishing";
import { routes } from "@/lib/routes";
import { getCatalog } from "@/server/catalog";
import { getCityFacts, getLaneSlugs, getRouteFacts } from "@/server/lane-facts";

/** One sitemap per page type: /sitemaps/sitemap/<id>.xml, listed by /sitemap.xml and robots.txt. */
export const sitemapIds = ["core", "trucks", "cities", "routes", "help"] as const;
export type SitemapId = (typeof sitemapIds)[number];

export function generateSitemaps() {
  return sitemapIds.map((id) => ({ id }));
}

const absolute = (path: string) => `${env.NEXT_PUBLIC_SITE_URL}${path === "/" ? "" : path}`;

/** hreflang alternates for a page that exists in every locale. */
function languages(path: `/${string}`) {
  return Object.fromEntries(
    indexableLocales().map((l) => [htmlLang[l], absolute(localizedHref(l, path))]),
  );
}

/** Only indexable pages are listed: sample, incomplete and draft-locale pages never are. */
export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const id = (await props.id) as SitemapId;
  switch (id) {
    case "core":
      return corePages();
    case "trucks": {
      const { trucks } = await getCatalog();
      return trucks
        .filter((truck) => !truck.isSample)
        .map((truck) => ({
          url: absolute(`/trucks/${truck.slug}`),
          changeFrequency: "monthly" as const,
          priority: 0.6,
        }));
    }
    case "cities": {
      const { areas } = await getCatalog();
      const facts = await Promise.all(areas.map((area) => getCityFacts(area.slug)));
      return facts
        .filter((f) => f?.indexable)
        .map((f) => ({
          url: absolute(`/truck-booking/${f!.area.slug}`),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        }));
    }
    case "routes": {
      const facts = await Promise.all((await getLaneSlugs()).map((slug) => getRouteFacts(slug)));
      return facts
        .filter((f) => f?.indexable)
        .map((f) => ({
          url: absolute(`/truck-booking/${f!.slug}`),
          changeFrequency: "weekly" as const,
          priority: 0.6,
        }));
    }
    case "help":
      return helpFaqs().map((faq) => ({
        url: absolute(`/help/${faq.slug}`),
        changeFrequency: "monthly" as const,
        priority: 0.4,
      }));
    default:
      return [];
  }
}

async function corePages(): Promise<MetadataRoute.Sitemap> {
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

  // The /truck-booking hub is listed once any city page is indexable.
  const { areas } = await getCatalog();
  const cityFacts = await Promise.all(areas.map((area) => getCityFacts(area.slug)));
  const hub: MetadataRoute.Sitemap = cityFacts.some((f) => f?.indexable)
    ? [{ url: absolute("/truck-booking"), changeFrequency: "weekly", priority: 0.7 }]
    : [];

  return [...pages, ...translated, ...hub];
}
