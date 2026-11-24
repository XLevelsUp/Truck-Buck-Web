import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

import { company } from "../src/content/company";
import { featureStatus } from "../src/content/features";
import { launchProblems } from "../src/launch-check";
import { allSitemapXml } from "./sitemaps";

/*
 * Phase 6: trust, safety, company and support pages.
 * Runs against a production build without client data: every missing fact
 * must be absent (not invented), and the launch guard must report it.
 */

const MOBILE = { width: 360, height: 740 };
const DESKTOP = { width: 1280, height: 900 };

async function settled(page: Page) {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
}

const pages = [
  "/safety",
  "/about",
  "/contact",
  "/help",
  "/help/how-is-the-fare-calculated",
  "/privacy",
  "/terms",
  "/refund-policy",
  "/grievance",
];

for (const path of pages) {
  for (const viewport of [MOBILE, DESKTOP]) {
    test(`${path} has zero axe violations and no overflow at ${viewport.width}px`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      expect((await page.goto(path))?.status()).toBe(200);
      await settled(page);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(" ")}`)).toEqual([]);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, "horizontal scroll").toBeLessThanOrEqual(0);
    });
  }
}

test("production pages never show missing-fact markers", async ({ page }) => {
  for (const path of pages) {
    await page.goto(path);
    await expect(page.getByTestId("missing-fact"), path).toHaveCount(0);
  }
});

test("legal pages are marked DRAFT until counsel signs off", async ({ page }) => {
  for (const path of ["/privacy", "/terms", "/refund-policy", "/grievance"]) {
    await page.goto(path);
    const banner = page.getByTestId("legal-draft");
    if (company.legalReview.approved) await expect(banner, path).toHaveCount(0);
    else await expect(banner, path).toContainText("DRAFT – review by lawyer");
  }
});

test("footer links every company and legal page, on every page", async ({ page }) => {
  for (const path of ["/", "/safety", "/help", "/ta/drivers"]) {
    await page.goto(path);
    const footer = page.getByRole("contentinfo");
    for (const href of [
      "/about",
      "/safety",
      "/help",
      "/contact",
      "/privacy",
      "/terms",
      "/refund-policy",
      "/grievance",
    ]) {
      await expect(footer.locator(`a[href="${href}"]`), `${path} → ${href}`).toHaveCount(1);
    }
  }
});

test("footer shows the company identity, or the launch guard blocks production", async ({
  page,
}) => {
  const problems = launchProblems();
  if (problems.length > 0) {
    // No client data yet: the guard must name exactly what is missing.
    expect(problems.join(" ")).toContain("NFC-4");
    return;
  }
  for (const path of ["/", "/contact", "/privacy"]) {
    await page.goto(path);
    const footer = page.getByRole("contentinfo");
    await expect(footer).toContainText(company.legalName!);
    await expect(footer).toContainText(company.registeredAddress!);
    await expect(footer).toContainText((company.cin ?? company.gstin)!);
  }
});

test("safety pipeline shows only confirmed or planned steps", async ({ page }) => {
  await page.goto("/safety");
  const steps = await page
    .locator("[data-step]")
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-step")));
  const expected = (
    ["vetKyc", "vetVehicleDocs", "vetDriverLicence", "vetFirstTrip", "vetRatingThreshold"] as const
  ).filter((key) => featureStatus[key] !== "unconfirmed");
  expect(steps).toEqual(expected);
  if (featureStatus.vetKyc === "roadmap") {
    await expect(page.locator('[data-step="vetKyc"]')).toContainText("Coming soon");
  }
});

test("counters and testimonials stay hidden without real, approved data", async ({ page }) => {
  for (const path of ["/", "/about"]) {
    await page.goto(path);
    await expect(page.getByTestId("live-counters"), path).toHaveCount(0);
  }
  await page.goto("/");
  await expect(page.locator("#social-title")).toHaveCount(0);
});

test("help: typo-tolerant search, one URL per answer, empty topics hidden", async ({ page }) => {
  await page.goto("/help");
  await page.getByRole("searchbox", { name: "Search help" }).fill("tols");
  const results = page.getByTestId("help-results");
  await expect(results.getByRole("link").first()).toContainText("Are tolls included?");
  await expect(page.getByRole("status").filter({ hasText: /answers?/ })).toBeVisible();

  await page.getByRole("searchbox", { name: "Search help" }).fill("");
  await expect(page.locator("#pricing")).toBeVisible();
  // No confirmed cancellation answers yet, so the topic isn't offered.
  await expect(page.locator("#cancellation")).toHaveCount(0);

  await page.locator("#pricing").getByRole("link", { name: "Are tolls included?" }).click();
  await expect(page).toHaveURL(/\/help\/are-tolls-included$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Are tolls included?");
  const schema = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(schema.some((json) => json.includes('"FAQPage"'))).toBe(true);
  await expect(page.getByRole("link", { name: "Contact us" })).toBeVisible();
});

test("header Help goes to the help centre", async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto("/");
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Help" }).click();
  await expect(page).toHaveURL(/\/help$/);
});

test("sitemap lists the Phase 6 pages and every help answer", async ({ request }) => {
  const xml = await allSitemapXml(request);
  for (const path of [...pages, "/help/are-tolls-included"]) {
    expect(xml, path).toContain(`${path}</loc>`);
  }
});

test.describe(() => {
  // Each form test is its own visitor, so the per-IP lead limit (5 / 10 min) isn't shared.
  test.use({ extraHTTPHeaders: { "x-forwarded-for": "198.51.100.61" } });

  test("contact form files a lead by topic", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/contact");
    const form = page.locator("form");
    await form.getByText("Press or partnership", { exact: true }).click();
    await form
      .getByRole("textbox", { name: "Your message" })
      .fill("We'd like to write about TruckBuck.");
    await form.getByRole("textbox", { name: "Your name" }).fill("E2E Press");
    await form.getByRole("textbox", { name: "Mobile number" }).fill("9876543210");
    await form.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Message received" })).toBeVisible({
      timeout: 20_000,
    });
  });
});

test.describe(() => {
  // Each form test is its own visitor, so the per-IP lead limit (5 / 10 min) isn't shared.
  test.use({ extraHTTPHeaders: { "x-forwarded-for": "198.51.100.63" } });

  test("contact form explains what is missing", async ({ page }) => {
    await page.goto("/contact");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("Tell us a little more (at least 10 characters).")).toBeVisible();
    await expect(page.getByText("Fill in this field.")).toBeVisible();
  });
});

test.describe(() => {
  // Each form test is its own visitor, so the per-IP lead limit (5 / 10 min) isn't shared.
  test.use({ extraHTTPHeaders: { "x-forwarded-for": "198.51.100.62" } });

  test("grievance form files a data-erasure request", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/grievance");
    const form = page.locator("#request form");
    await form.getByText("Delete my data", { exact: true }).click();
    await form
      .getByRole("textbox", { name: "Your message" })
      .fill("Please delete my callback request details.");
    await form.getByRole("textbox", { name: "Your name" }).fill("E2E Grievance");
    await form.getByRole("textbox", { name: "Mobile number" }).fill("9876543210");
    await form.getByRole("button", { name: "Submit request" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Request received" })).toBeVisible({
      timeout: 20_000,
    });
  });
});
