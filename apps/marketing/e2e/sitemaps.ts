import type { APIRequestContext } from "@playwright/test";

/**
 * Every page sitemap's XML, concatenated: /sitemap.xml is an index of
 * per-type sitemaps (/sitemaps/sitemap/<type>.xml). Locs are rewritten to
 * the server under test, so `${path}</loc>` checks work locally.
 */
export async function allSitemapXml(request: APIRequestContext): Promise<string> {
  const index = await (await request.get("/sitemap.xml")).text();
  const sitemaps = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]!).pathname);
  const parts = await Promise.all(sitemaps.map(async (path) => (await request.get(path)).text()));
  return parts.join("\n");
}
