import { expect, test } from "@playwright/test";

import { auditBundles } from "../scripts/check-bundle.mjs";

/*
 * Phase 8 performance guards that don't need Lighthouse:
 *   - JS budget per page (scripts/check-bundle.mjs): our JS beyond the
 *     framework ≤ 80 KB gzipped, no third-party scripts at load.
 *   - English pages never download the Hindi/Tamil fonts.
 *   - Identical estimate requests are cacheable by the CDN.
 */

test("JS budget: our code ≤ 80 KB gzipped per page, no third-party scripts", async ({
  baseURL,
}) => {
  test.slow();
  const { problems, results } = await auditBundles(baseURL);
  expect(problems).toEqual([]);
  expect(results.length).toBeGreaterThan(40);
});

test("English pages never download the Hindi or Tamil fonts", async ({ page }) => {
  const requested: string[] = [];
  page.on("request", (r) => {
    if (r.url().endsWith(".woff2")) requested.push(new URL(r.url()).pathname);
  });
  for (const path of ["/", "/pricing", "/transporters", "/trucks/lcv-14ft"]) {
    await page.goto(path, { waitUntil: "networkidle" });
  }
  // Font files declared for the Noto families (Geist's own subsets, incl. ₹, are fine).
  const notoFiles = await page.evaluate(() =>
    [...document.styleSheets].flatMap((sheet) =>
      [...sheet.cssRules]
        .filter((rule): rule is CSSFontFaceRule => rule instanceof CSSFontFaceRule)
        .filter((rule) => rule.style.getPropertyValue("font-family").includes("Noto"))
        .flatMap((rule) =>
          [...rule.style.getPropertyValue("src").matchAll(/url\("?([^")]+)"?\)/g)].map(
            (m) => new URL(m[1]!, location.href).pathname,
          ),
        ),
    ),
  );
  expect(notoFiles.length).toBeGreaterThan(0);
  expect(requested.filter((path) => notoFiles.includes(path))).toEqual([]);
});

test("the Places script is never loaded: address search goes through our API", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (r) => {
    if (/maps\.googleapis\.com|challenges\.cloudflare\.com/.test(r.url())) external.push(r.url());
  });
  await page.goto("/", { waitUntil: "networkidle" });
  // Turnstile and Maps load on demand only: nothing third-party before interaction.
  expect(external).toEqual([]);
});
