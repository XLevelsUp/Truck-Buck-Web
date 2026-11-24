import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

import { isLocaleIndexable } from "../src/i18n/publishing";

/*
 * Phase 4: audience pages, truck catalogue, pricing, how it works.
 * Runs against a production build with sample data (ALLOW_SAMPLE_DATA=true).
 */

const MOBILE = { width: 360, height: 740 };

/** Let finite CSS transitions settle so axe never samples a colour mid-fade. */
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

async function faqSchemaCount(page: Page) {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.filter((text) => text.includes('"FAQPage"')).length;
}

test.describe("transporter application on a 360px phone", () => {
  test.use({ viewport: MOBILE, hasTouch: true, isMobile: true });

  test("can be completed in under 2 minutes", async ({ page }) => {
    const started = Date.now();
    await page.goto("/transporters");
    const form = page.locator("#apply");

    await form.getByRole("textbox", { name: "Owner's name" }).fill("E2E Fleet Owner");
    await form.getByRole("textbox", { name: "Mobile number" }).fill("9876543210");
    await form.getByRole("textbox", { name: "City" }).fill("Chennai");
    await form.getByRole("button", { name: "Next" }).tap();

    await expect(form.getByRole("heading", { name: "Your fleet" })).toBeFocused({
      timeout: 10_000,
    });
    await form.getByText("2–5", { exact: true }).tap();
    await form.getByText("LCV 14 ft", { exact: true }).tap();
    await form.getByText("Container 32 ft MXL", { exact: true }).tap();
    await form.getByRole("textbox", { name: "Home base" }).fill("Chennai");
    await form.getByRole("button", { name: "Send application" }).tap();

    await expect(form.getByRole("status").filter({ hasText: "Application received" })).toBeVisible({
      timeout: 20_000,
    });
    await expect(form.getByText(/We'll call \+91 98765 43210/)).toBeVisible();
    expect(Date.now() - started).toBeLessThan(120_000);

    const draft = await page.evaluate(() => localStorage.getItem("tb.transporter-application.v1"));
    expect(draft).toBeNull();
  });

  test("progress survives closing the tab", async ({ page, context }) => {
    test.slow();
    await page.goto("/transporters");
    const form = page.locator("#apply");
    await form.getByRole("textbox", { name: "Owner's name" }).fill("Resume Test");
    await form.getByRole("textbox", { name: "Mobile number" }).fill("9876543210");
    await form.getByRole("textbox", { name: "City" }).fill("Madurai");
    await form.getByRole("button", { name: "Next" }).click();
    await form.getByText("6–10", { exact: true }).click();
    await page.close();

    const reopened = await context.newPage();
    await reopened.goto("/transporters");
    const again = reopened.locator("#apply");
    await expect(again.getByText("We kept your answers from last time.")).toBeVisible();
    await expect(again.getByRole("heading", { name: "Your fleet" })).toBeVisible();
    await expect(again.getByRole("radio", { name: "6–10" })).toBeChecked();
    await again.getByRole("button", { name: "Back" }).click();
    await expect(again.getByRole("textbox", { name: "City" })).toHaveValue("Madurai");
  });

  test("validates each step before moving on", async ({ page }) => {
    await page.goto("/transporters");
    const form = page.locator("#apply");
    await form.getByRole("button", { name: "Next" }).click();
    await expect(form.getByText("Enter your name.")).toBeVisible();
    await expect(form.getByRole("textbox", { name: "Owner's name" })).toBeFocused();
  });
});

test("shippers: business account form checks the GSTIN checksum", async ({ page }) => {
  await page.goto("/shippers");
  const form = page.locator("#business-account");
  await form.getByRole("textbox", { name: "Company name" }).fill("E2E Traders");
  await form.getByRole("textbox", { name: /GSTIN/ }).fill("27AAPFU0939F1ZW");
  await form.getByText("6–20", { exact: true }).click();
  await form.getByRole("textbox", { name: "Your usual routes" }).fill("Chennai to Bengaluru");
  await form.getByRole("textbox", { name: "Your name" }).fill("E2E Buyer");
  await form.getByRole("textbox", { name: "Mobile number" }).fill("9876543210");
  await form.getByRole("button", { name: "Request a call" }).click();
  await expect(form.getByText("Enter a valid 15-character GSTIN.")).toBeVisible();

  await form.getByRole("textbox", { name: /GSTIN/ }).fill("27AAPFU0939F1ZV");
  await form.getByRole("button", { name: "Request a call" }).click();
  await expect(form.getByRole("status").filter({ hasText: "we'll call you" })).toBeVisible({
    timeout: 20_000,
  });
});

for (const [path, lang] of [
  ["/drivers", "en-IN"],
  ["/hi/drivers", "hi-IN"],
  ["/ta/drivers", "ta-IN"],
] as const) {
  test(`${path} is served in ${lang} with hreflang for reviewed languages and no cash/lottery language`, async ({
    page,
  }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    // Drafts (NFC-22) are reachable in preview builds but never offered as alternates.
    const reviewed = (["hi", "ta"] as const).filter(isLocaleIndexable);
    for (const hreflang of ["hi-IN", "ta-IN"]) {
      const expected = reviewed.some((locale) => `${locale}-IN` === hreflang) ? 1 : 0;
      await expect(page.locator(`link[rel="alternate"][hreflang="${hreflang}"]`)).toHaveCount(
        expected,
      );
    }
    const text = await page.locator("main").innerText();
    expect(text).not.toMatch(/cash|lottery|jackpot|लॉटरी|नकद|லாட்டரி|ரொக்க/i);
    expect(await faqSchemaCount(page)).toBe(1);
  });
}

test("drivers: rewards waitlist (Tamil page)", async ({ page }) => {
  await page.goto("/ta/drivers");
  const rewards = page.locator("#rewards");
  await rewards.getByRole("textbox", { name: "உங்கள் பெயர்" }).fill("E2E Driver");
  await rewards.getByRole("textbox", { name: "மொபைல் எண்" }).fill("9876543210");
  await rewards.getByRole("textbox", { name: "நகரம்" }).fill("Coimbatore");
  await rewards.getByRole("button", { name: "காத்திருப்புப் பட்டியலில் சேருங்கள்" }).click();
  await expect(rewards.getByRole("status")).toContainText("காத்திருப்புப் பட்டியலில்", {
    timeout: 20_000,
  });
});

test("drivers: QR code on desktop only", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/drivers");
  await expect(page.getByRole("img", { name: /QR code/ })).toBeVisible();
  await page.setViewportSize(MOBILE);
  await expect(page.getByRole("img", { name: /QR code/ })).toBeHidden();
});

test("trucks: catalogue, helper and every detail page", async ({ page }) => {
  await page.goto("/trucks");
  const cards = page.getByRole("link", { name: /^See details/ });
  await expect(cards).toHaveCount(8);

  // 3.7 t × 1.1 headroom = 4.07 t: too much for the 4 t LCV 14 ft, so the 5 t LCV 17 ft.
  await page.getByRole("spinbutton", { name: "Weight (tonnes)" }).fill("3.7");
  await page.getByRole("button", { name: "Suggest a truck" }).click();
  await expect(page.getByText("We suggest: LCV 17 ft")).toBeVisible();

  const hrefs = await cards.evaluateAll((links) => links.map((a) => a.getAttribute("href")));
  for (const href of hrefs) {
    const response = await page.goto(href ?? "");
    expect(response?.status(), href ?? "").toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});

test("truck detail: specs, prefilled quote, schema, no layout shift", async ({ page }) => {
  await page.goto("/trucks/container-32ft");
  await expect(page.getByRole("rowheader", { name: "What fits" })).toBeVisible();
  await expect(page.getByRole("radio", { name: /Container 32 ft MXL/ })).toBeChecked();
  const schema = (await page.locator('script[type="application/ld+json"]').allTextContents()).join(
    "",
  );
  expect(schema).toContain('"@type":"Product"');
  expect(schema).toContain('"@type":"Service"');

  const cls = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let total = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as (PerformanceEntry & {
            value: number;
            hadRecentInput: boolean;
          })[]) {
            if (!entry.hadRecentInput) total += entry.value;
          }
        }).observe({ type: "layout-shift", buffered: true });
        setTimeout(() => resolve(total), 1500);
      }),
  );
  expect(cls).toBeLessThan(0.05);
});

test("pricing: worked example from the rate card and the estimator", async ({ page }) => {
  await page.goto("/pricing");
  const example = page.locator("section", {
    has: page.getByRole("heading", { name: "A worked example" }),
  });
  await expect(example.getByText(/₹[\d,]+ – ₹[\d,]+/)).toBeVisible();
  await expect(example.getByText("Base fare")).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Pickup" })).toBeVisible();
  expect(await faqSchemaCount(page)).toBe(1);
});

test("how it works: every role's steps are in the HTML", async ({ page }) => {
  await page.goto("/how-it-works");
  await page.getByRole("tab", { name: "Transporter" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("Offer to vetted transporters");
  const html = await page.content();
  for (const role of ["shipper", "transporter", "driver"]) {
    expect(html).toContain(`data-state`);
    expect(html.toLowerCase()).toContain(role);
  }
});

test("new pages each carry one FAQPage schema", async ({ page }) => {
  for (const path of ["/shippers", "/transporters", "/trucks", "/pricing", "/how-it-works"]) {
    await page.goto(path);
    expect(await faqSchemaCount(page), path).toBe(1);
  }
});

test("sitemap lists the new pages", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  for (const path of [
    "/shippers",
    "/transporters",
    "/drivers",
    "/trucks",
    "/pricing",
    "/how-it-works",
  ]) {
    expect(xml, path).toContain(`${path}</loc>`);
  }
  // Translated pages join the sitemap once reviewed (see phase5.spec.ts).
});

test("unknown URLs get the 404 page", async ({ page }) => {
  expect((await page.goto("/no-such-page"))?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  const unknownLocale = await page.goto("/fr/drivers");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  expect([200, 404]).toContain(unknownLocale?.status());
});

const pages = [
  "/shippers",
  "/transporters",
  "/drivers",
  "/hi/drivers",
  "/ta/drivers",
  "/trucks",
  "/trucks/lcv-14ft",
  "/pricing",
  "/how-it-works",
];
for (const path of pages) {
  for (const viewport of [MOBILE, { width: 1280, height: 900 }]) {
    test(`${path} has zero axe violations at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(path);
      await settled(page);
      const results = await new AxeBuilder({ page }).analyze();
      expect(
        results.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target.join(" ")),
        })),
      ).toEqual([]);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, "horizontal scroll").toBeLessThanOrEqual(0);
    });
  }
}

test("dark theme: new pages pass axe", async ({ page }) => {
  test.slow(); // four full axe runs
  await page.emulateMedia({ colorScheme: "dark" });
  for (const path of ["/shippers", "/transporters", "/pricing", "/ta/drivers"]) {
    await page.goto(path);
    await settled(page);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((v) => `${path}: ${v.id}`)).toEqual([]);
  }
});
