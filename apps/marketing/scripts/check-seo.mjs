/**
 * SEO audit against a running build (default http://localhost:3200):
 *   - every URL in every sitemap (via the /sitemap.xml index) returns 200,
 *     is indexable and has a canonical pointing at itself;
 *   - titles ≤ 60 and descriptions ≤ 155 characters;
 *   - no two pages share a title or a description.
 * Programmatic /truck-booking pages are audited too, indexed or not, so a
 * template change can't create duplicates before the pages go live.
 *
 * Run: node scripts/check-seo.mjs [baseUrl]
 */

const TITLE_MAX = 60;
const DESCRIPTION_MAX = 155;

const decode = (text) =>
  text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();

function meta(html, attr, name) {
  const pattern = new RegExp(`<meta[^>]*${attr}="${name}"[^>]*content="([^"]*)"`, "i");
  const reversed = new RegExp(`<meta[^>]*content="([^"]*)"[^>]*${attr}="${name}"`, "i");
  const match = html.match(pattern) ?? html.match(reversed);
  return match ? decode(match[1]) : null;
}

function locs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

/** Rewrites a sitemap URL (production origin) onto the server under test. */
const onBase = (base, url) => {
  const { pathname, search } = new URL(url);
  return { path: `${pathname}${search}`, url: `${base}${pathname}${search}` };
};

export async function auditSeo(base = "http://localhost:3200") {
  const problems = [];
  const index = await (await fetch(`${base}/sitemap.xml`)).text();
  const sitemapUrls = locs(index);
  if (sitemapUrls.length === 0) problems.push("sitemap.xml lists no sitemaps");

  const listed = new Set();
  for (const sitemap of sitemapUrls) {
    const { url } = onBase(base, sitemap);
    const response = await fetch(url);
    if (!response.ok) {
      problems.push(`${url}: HTTP ${response.status}`);
      continue;
    }
    for (const loc of locs(await response.text())) listed.add(onBase(base, loc).path);
  }

  // Programmatic pages, including noindex ones, via the hub's links.
  const programmatic = new Set();
  const hub = await fetch(`${base}/truck-booking`);
  if (hub.ok) {
    for (const match of (await hub.text()).matchAll(/href="(\/truck-booking\/[a-z0-9-]+)"/g)) {
      programmatic.add(match[1]);
    }
  }

  const pages = [...new Set([...listed, ...programmatic])].sort();
  const byTitle = new Map();
  const byDescription = new Map();

  for (const path of pages) {
    const response = await fetch(`${base}${path}`);
    if (response.status !== 200) {
      problems.push(`${path}: HTTP ${response.status}`);
      continue;
    }
    const html = await response.text();
    const title = decode(html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "");
    const description = meta(html, "name", "description");
    const robots = meta(html, "name", "robots") ?? "";
    const canonical = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1];

    if (!title) problems.push(`${path}: no <title>`);
    else if (title.length > TITLE_MAX)
      problems.push(`${path}: title ${title.length} chars "${title}"`);
    if (!description) problems.push(`${path}: no meta description`);
    else if (description.length > DESCRIPTION_MAX) {
      problems.push(`${path}: description ${description.length} chars`);
    }
    if (!canonical) problems.push(`${path}: no canonical`);
    else if (new URL(canonical).pathname !== path) {
      problems.push(`${path}: canonical points at ${new URL(canonical).pathname}`);
    }
    if (listed.has(path) && /noindex/i.test(robots)) {
      problems.push(`${path}: in a sitemap but noindex`);
    }

    if (title) byTitle.set(title, [...(byTitle.get(title) ?? []), path]);
    if (description)
      byDescription.set(description, [...(byDescription.get(description) ?? []), path]);
  }

  for (const [title, paths] of byTitle) {
    if (paths.length > 1) problems.push(`duplicate title "${title}": ${paths.join(", ")}`);
  }
  for (const [description, paths] of byDescription) {
    if (paths.length > 1) {
      problems.push(`duplicate description "${description.slice(0, 60)}…": ${paths.join(", ")}`);
    }
  }

  return { pages: pages.length, listed: listed.size, problems };
}

if (
  import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}` ||
  process.argv[1]?.endsWith("check-seo.mjs")
) {
  const base = process.argv[2] ?? "http://localhost:3200";
  const { pages, listed, problems } = await auditSeo(base);
  if (problems.length > 0) {
    console.error(`SEO audit failed (${problems.length}):`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }
  // eslint-disable-next-line no-console -- CLI result line.
  console.log(
    `SEO audit passed: ${pages} pages (${listed} in sitemaps), unique titles and descriptions.`,
  );
}
