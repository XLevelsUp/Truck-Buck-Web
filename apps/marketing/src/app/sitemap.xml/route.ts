import { env } from "@/env";

import { sitemapIds } from "../sitemaps/sitemap";

/**
 * GET /sitemap.xml — sitemap index pointing at the per-type sitemaps
 * (/sitemaps/sitemap/core.xml, …/trucks.xml, …) that app/sitemaps/sitemap.ts generates.
 */
export function GET() {
  const base = env.NEXT_PUBLIC_SITE_URL;
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...sitemapIds.map((id) => `  <sitemap><loc>${base}/sitemaps/sitemap/${id}.xml</loc></sitemap>`),
    "</sitemapindex>",
  ].join("\n");
  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
