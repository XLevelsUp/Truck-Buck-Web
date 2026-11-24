import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

import { auditSeo } from "../scripts/check-seo.mjs";
import { allSitemapXml } from "./sitemaps";

/*
 * Phase 7: technical SEO and programmatic city/lane pages. The local build
 * has only sample lanes and rates, so every programmatic page must exist,
 * be complete as a template, and stay noindex and out of the sitemaps.
 */

const MOBILE = { width: 360, height: 740 };
const DESKTOP = { width: 1280, height: 900 };
/** The sample lane with every fact filled in (see server/sample-data.ts). */
const FULL_LANE = "/truck-booking/coimbatore-to-kochi";
const CITY = "/truck-booking/coimbatore";

type Node = Record<string, unknown> & { "@type"?: string | string[] };

/** Every JSON-LD node on the page, flattening @graph wrappers and arrays. */
async function jsonLd(page: Page): Promise<Node[]> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.flatMap((text) => {
    const data = JSON.parse(text) as Node | Node[];
    const list = Array.isArray(data) ? data : [data];
    return list.flatMap((item) =>
      Array.isArray(item["@graph"]) ? (item["@graph"] as Node[]) : [item],
    );
  });
}
const ofType = (nodes: Node[], type: string) => nodes.filter((n) => n["@type"] === type);

/** Minimum fields Google's Rich Results Test requires for the types we emit. */
function expectValidRichResults(nodes: Node[]) {
  for (const crumbs of ofType(nodes, "BreadcrumbList")) {
    const items = crumbs.itemListElement as { position: number; name: string; item: string }[];
    expect(items.length).toBeGreaterThanOrEqual(2);
    items.forEach((item, index) => {
      expect(item.position).toBe(index + 1);
      expect(item.name).toBeTruthy();
      expect(item.item).toMatch(/^https?:\/\//);
    });
  }
  for (const faq of ofType(nodes, "FAQPage")) {
    const entities = faq.mainEntity as { name: string; acceptedAnswer: { text: string } }[];
    expect(entities.length).toBeGreaterThan(0);
    for (const q of entities) {
      expect(q.name).toBeTruthy();
      expect(q.acceptedAnswer.text).toBeTruthy();
    }
  }
  // Product needs offers, review or aggregateRating: we only emit it with offers.
  for (const product of ofType(nodes, "Product")) {
    expect(product.offers, "Product without offers").toBeTruthy();
  }
  for (const business of ofType(nodes, "LocalBusiness")) {
    expect(business.address, "LocalBusiness without address").toBeTruthy();
  }
}

test("SEO audit: unique titles and descriptions, lengths, canonicals, sitemap hygiene", async ({
  baseURL,
}) => {
  test.slow();
  const { pages, problems } = await auditSeo(baseURL);
  expect(problems).toEqual([]);
  expect(pages).toBeGreaterThan(40);
});

test("sitemap index lists one sitemap per page type; robots lists them all", async ({
  request,
}) => {
  const index = await (await request.get("/sitemap.xml")).text();
  expect(index).toContain("<sitemapindex");
  for (const type of ["core", "trucks", "cities", "routes", "help"]) {
    expect(index).toContain(`/sitemaps/sitemap/${type}.xml</loc>`);
    const response = await request.get(`/sitemaps/sitemap/${type}.xml`);
    expect(response.status(), type).toBe(200);
    expect(await response.text()).toContain("<urlset");
  }
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("/sitemap.xml");
  expect(robots).toContain("/sitemaps/sitemap/routes.xml");
});

test("sample city and lane pages are built but never indexed or listed", async ({
  page,
  request,
}) => {
  const xml = await allSitemapXml(request);
  for (const path of [CITY, FULL_LANE]) {
    expect((await page.goto(path))?.status(), path).toBe(200);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    expect(xml).not.toContain(`${path}</loc>`);
  }
});

test("a complete lane page has ≥ 300 words of computed content", async ({ page }) => {
  await page.goto(FULL_LANE);
  const words = await page.evaluate(() => {
    const main = document.querySelector("main")!.cloneNode(true) as HTMLElement;
    main.querySelectorAll("#get-price, nav, script, footer").forEach((el) => el.remove());
    return main.innerText.split(/\s+/).filter(Boolean).length;
  });
  expect(words).toBeGreaterThanOrEqual(300);

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Truck booking from Coimbatore to Kochi",
  );
  await expect(page.getByText(/\d+ km apart by road/)).toBeVisible();
  await expect(page.getByText(/crosses from Tamil Nadu into Kerala/)).toBeVisible();
  const rows = page.locator('section[aria-labelledby="fares-title"] tbody tr');
  expect(await rows.count()).toBeGreaterThan(3);
  await expect(page.getByText("Trucks on this lane usually run on NH 544.")).toBeVisible();
  // Widget is prefilled with both cities.
  await expect(page.getByRole("combobox", { name: "Pickup" })).toHaveValue(
    "Coimbatore, Tamil Nadu",
  );
  await expect(page.getByRole("combobox", { name: "Drop" })).toHaveValue("Kochi, Kerala");
});

test("lane pages differ from each other (no spun text)", async ({ page }) => {
  const texts: string[] = [];
  for (const path of [FULL_LANE, "/truck-booking/chennai-to-bengaluru"]) {
    await page.goto(path);
    texts.push(await page.locator('section[aria-labelledby="facts-title"] dl').innerText());
  }
  expect(texts[0]).not.toEqual(texts[1]);
});

test("city page: prefilled widget, routes, trucks, nearby cities and FAQ", async ({ page }) => {
  await page.goto(CITY);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Truck booking in Coimbatore");
  await expect(page.getByRole("combobox", { name: "Pickup" })).toHaveValue(
    "Coimbatore, Tamil Nadu",
  );
  await expect(page.locator('a[href="/truck-booking/coimbatore-to-kochi"]').first()).toBeVisible();
  await expect(page.locator("#city-trucks-title")).toBeVisible();
  await expect(page.locator('a[href="/truck-booking/tiruppur"]').first()).toBeVisible();
  const nodes = await jsonLd(page);
  expect(ofType(nodes, "FAQPage")).toHaveLength(1);
  expect(ofType(nodes, "Service")).toHaveLength(1);
  expectValidRichResults(nodes);
});

test("structured data is valid on home, a truck page, a lane page and a help page", async ({
  page,
}) => {
  const expectations: [string, string[]][] = [
    ["/", ["Organization", "WebSite", "FAQPage"]],
    ["/trucks/lcv-14ft", ["BreadcrumbList", "FAQPage"]],
    [FULL_LANE, ["BreadcrumbList", "Service"]],
    ["/help/how-is-the-fare-calculated", ["BreadcrumbList", "FAQPage"]],
  ];
  for (const [path, types] of expectations) {
    await page.goto(path);
    const nodes = await jsonLd(page);
    for (const type of types)
      expect(ofType(nodes, type).length, `${path} ${type}`).toBeGreaterThan(0);
    expectValidRichResults(nodes);
  }
  await page.goto("/");
  const website = ofType(await jsonLd(page), "WebSite")[0]!;
  const action = website.potentialAction as { target: { urlTemplate: string } };
  expect(action.target.urlTemplate).toContain("/help?q={search_term_string}");
});

test("site search box target: /help?q= fills the search", async ({ page }) => {
  await page.goto("/help?q=tolls");
  await expect(page.getByRole("searchbox", { name: "Search help" })).toHaveValue("tolls");
  await expect(page.getByTestId("help-results").getByRole("link").first()).toContainText("tolls");
});

test("unknown cities and lanes are 404s with a quote widget", async ({ page }) => {
  for (const path of ["/truck-booking/atlantis", "/truck-booking/chennai-to-atlantis"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: "Page not found" }), path).toBeVisible();
  }
  expect((await page.goto("/no-such-page"))?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Looking for a truck? Get a price" }),
  ).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Pickup" })).toBeVisible();
});

test("internal links: lane ↔ cities ↔ trucks ↔ pricing, breadcrumbs on all", async ({ page }) => {
  await page.goto(FULL_LANE);
  const crumbs = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(crumbs.getByRole("link", { name: "Truck booking", exact: true })).toHaveAttribute(
    "href",
    "/truck-booking",
  );
  for (const href of ["/truck-booking/coimbatore", "/truck-booking/kochi", "/pricing", "/trucks"]) {
    await expect(page.locator(`main a[href="${href}"]`).first(), href).toBeVisible();
  }
  await expect(page.locator('main a[href^="/trucks/"]').first()).toBeVisible();
  await page.goto("/truck-booking");
  await expect(page.locator('a[href="/truck-booking/coimbatore"]')).toBeVisible();
});

for (const path of ["/truck-booking", CITY, FULL_LANE]) {
  for (const viewport of [MOBILE, DESKTOP]) {
    test(`${path} has zero axe violations and no overflow at ${viewport.width}px`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto(path);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(" ")}`)).toEqual([]);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
}
