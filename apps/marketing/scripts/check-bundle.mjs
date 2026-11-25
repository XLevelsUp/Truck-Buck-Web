/**
 * JS budget, measured on what a modern browser downloads up front (every
 * <script src> except noModule polyfills; on-demand chunks such as the fare
 * result and lead form are not counted until used), gzipped:
 *
 *   - APP_BUDGET_KB: our own JS beyond the framework baseline (React +
 *     Next.js runtime, i.e. the chunks every page loads, measured on the 404
 *     page). This is what the build enforces.
 *   - TARGET_TOTAL_KB: the brief's 120 KB total. React 19 + Next.js 16 alone
 *     is ~129 KB gzipped, so no App Router page can meet it; totals are
 *     reported against it so the gap stays visible (see docs/performance.md).
 *   - No third-party <script src> on any page at load.
 *
 * Runs against a production server (default http://localhost:3200) and checks
 * every sitemap URL plus the programmatic /truck-booking pages and a 404.
 *
 * Run: node scripts/check-bundle.mjs [baseUrl] [--json]
 */
import { gzipSync } from "node:zlib";

export const APP_BUDGET_KB = 80;
export const TARGET_TOTAL_KB = 120;

const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
const pathOf = (url) => new URL(url).pathname;

async function pagesToCheck(base) {
  const paths = new Set(["/", "/no-such-page"]);
  const index = await (await fetch(`${base}/sitemap.xml`)).text();
  for (const sitemap of locs(index)) {
    const xml = await (await fetch(`${base}${pathOf(sitemap)}`)).text();
    for (const loc of locs(xml)) paths.add(pathOf(loc));
  }
  const hub = await (await fetch(`${base}/truck-booking`)).text();
  paths.add("/truck-booking");
  for (const match of hub.matchAll(/href="(\/truck-booking\/[a-z0-9-]+)"/g)) paths.add(match[1]);
  return [...paths].sort();
}

const scriptSrcs = (html) =>
  [...html.matchAll(/<script[^>]+src="([^"]+)"[^>]*>/g)]
    .filter((m) => !/\bnomodule\b/i.test(m[0]))
    .map((m) => m[1].replace(/&amp;/g, "&"));

export async function auditBundles(base = "http://localhost:3200") {
  const chunkSizes = new Map();
  const gzipped = async (src) => {
    if (!chunkSizes.has(src)) {
      const response = await fetch(new URL(src, base));
      const bytes = Buffer.from(await response.arrayBuffer());
      chunkSizes.set(src, gzipSync(bytes, { level: 9 }).length);
    }
    return chunkSizes.get(src);
  };

  // Framework baseline: the chunks the 404 page loads (no page code of ours but the shell).
  const floorHtml = await (await fetch(`${base}/no-such-page`)).text();
  const framework = new Set(scriptSrcs(floorHtml).filter((src) => src.startsWith("/")));
  let frameworkBytes = 0;
  for (const src of framework) frameworkBytes += await gzipped(src);

  const kb = (bytes) => Math.round((bytes / 1024) * 10) / 10;
  const results = [];
  for (const path of await pagesToCheck(base)) {
    const html = await (await fetch(`${base}${path}`)).text();
    const all = scriptSrcs(html);
    const srcs = all.filter((src) => src.startsWith("/"));
    const external = all.filter((src) => /^(https?:)?\/\//.test(src));
    let bytes = 0;
    let appBytes = 0;
    for (const src of new Set(srcs)) {
      const size = await gzipped(src);
      bytes += size;
      if (!framework.has(src)) appBytes += size;
    }
    // Inline scripts (RSC payload, bootstrap) ship in the HTML; count them too.
    const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]
      .map((m) => m[1])
      .join("");
    const inlineBytes = gzipSync(Buffer.from(inline), { level: 9 }).length;
    results.push({
      path,
      totalKb: kb(bytes),
      appKb: kb(appBytes),
      inlineKb: kb(inlineBytes),
      scripts: srcs.length,
      external,
    });
  }
  const problems = results.flatMap((r) => [
    ...(r.appKb > APP_BUDGET_KB
      ? [`${r.path}: ${r.appKb} KB of our JS (gzipped) > ${APP_BUDGET_KB} KB`]
      : []),
    ...r.external.map((src) => `${r.path}: third-party script ${src}`),
  ]);
  return { results, problems, frameworkKb: kb(frameworkBytes) };
}

if (process.argv[1]?.endsWith("check-bundle.mjs")) {
  const base = process.argv.find((arg) => arg.startsWith("http")) ?? "http://localhost:3200";
  const { results, problems, frameworkKb } = await auditBundles(base);
  if (process.argv.includes("--json")) {
    // eslint-disable-next-line no-console -- CLI output.
    console.log(JSON.stringify(results, null, 2));
  } else {
    const worst = [...results].sort((a, b) => b.totalKb - a.totalKb).slice(0, 10);
    // eslint-disable-next-line no-console -- CLI output.
    console.log(`Framework baseline (React + Next.js): ${frameworkKb} KB gzipped`);
    // eslint-disable-next-line no-console -- CLI output.
    console.table(
      worst.map(({ path, totalKb, appKb, inlineKb }) => ({
        path,
        totalKb,
        appKb,
        inlineKb,
        [`vs ${TARGET_TOTAL_KB} KB target`]:
          totalKb <= TARGET_TOTAL_KB ? "ok" : `+${Math.round(totalKb - TARGET_TOTAL_KB)}`,
      })),
    );
  }
  if (problems.length > 0) {
    console.error(`JS budget failed (${problems.length}):`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }
  // eslint-disable-next-line no-console -- CLI result line.
  console.log(
    `JS budget passed: ${results.length} pages, our JS ≤ ${APP_BUDGET_KB} KB gzipped, no third-party scripts.`,
  );
}
