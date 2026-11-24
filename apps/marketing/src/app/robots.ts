import type { MetadataRoute } from "next";

import { env } from "@/env";

import { sitemapIds } from "./sitemaps/sitemap";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    // The index, plus each per-type sitemap for crawlers that skip indexes.
    sitemap: [
      `${env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
      ...sitemapIds.map((id) => `${env.NEXT_PUBLIC_SITE_URL}/sitemaps/sitemap/${id}.xml`),
    ],
    host: env.NEXT_PUBLIC_SITE_URL,
  };
}
