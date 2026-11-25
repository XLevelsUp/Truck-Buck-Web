import type { MetadataRoute } from "next";

import { env } from "@/env";

import { sitemapIds } from "./sitemaps/sitemap";

/**
 * Vercel Preview deployments (including staging) must never be indexed:
 * block all crawling there. Production and local builds use the real rules.
 */
const isNonProductionDeploy =
  Boolean(process.env.VERCEL_ENV) && process.env.VERCEL_ENV !== "production";

export default function robots(): MetadataRoute.Robots {
  if (isNonProductionDeploy) return { rules: { userAgent: "*", disallow: "/" } };
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
