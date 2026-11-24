import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

import { LOCALE_COOKIE, prefixedLocales, translationReview } from "../src/i18n/locales";
import { isLocaleIndexable, isLocalePublished } from "../src/i18n/publishing";

/*
 * Phase 5: localisation, visuals and content rules.
 * Runs against a production build with PREVIEW_UNREVIEWED_LOCALES=true, so
 * the draft hi/ta pages are reachable (as on a Vercel Preview).
 */

const MOBILE = { width: 360, height: 740 };
const DESKTOP = { width: 1280, height: 900 };

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

const localized = [
  ["/hi", "hi-IN"],
  ["/ta", "ta-IN"],
  ["/hi/transporters", "hi-IN"],
  ["/ta/transporters", "ta-IN"],
  ["/hi/drivers", "hi-IN"],
  ["/ta/drivers", "ta-IN"],
] as const;

for (const [path, lang] of localized) {
  test(`${path} renders in ${lang} at 360px without overflow or axe violations`, async ({
    page,
  }) => {
    await page.setViewportSize(MOBILE);
    expect((await page.goto(path))?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    await settled(page);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, "horizontal scroll").toBeLessThanOrEqual(0);

    // No element (outside intentional scrollers) pokes past the viewport.
    const wide = await page.evaluate(() =>
      [...document.querySelectorAll("main *")]
        .filter((el) => {
          if (el.closest(".overflow-x-auto")) return false;
          return el.getBoundingClientRect().right > document.documentElement.clientWidth + 1;
        })
        .map((el) => `${el.tagName} ${el.textContent?.slice(0, 40)}`),
    );
    expect(wide).toEqual([]);

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(" ")}`)).toEqual([]);
  });
}

test("unreviewed translations are labelled as drafts and kept out of search", async ({ page }) => {
  for (const locale of prefixedLocales) {
    if (translationReview[locale].reviewed) continue;
    await page.goto(`/${locale}`);
    await expect(page.getByTestId("translation-draft")).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  }
  await page.goto("/");
  await expect(page.getByTestId("translation-draft")).toHaveCount(0);
});

test("hreflang lists only reviewed languages", async ({ page }) => {
  const indexable = (["en", ...prefixedLocales] as const).filter(isLocaleIndexable);
  for (const path of ["/", "/drivers", "/transporters"]) {
    await page.goto(path);
    const hreflangs = await page
      .locator('link[rel="alternate"][hreflang]')
      .evaluateAll((links) => links.map((link) => link.getAttribute("hreflang")));
    if (indexable.length < 2) {
      expect(hreflangs, path).toEqual([]);
    } else {
      expect(hreflangs.sort(), path).toEqual(
        [...indexable.map((l) => `${l}-IN`), "x-default"].sort(),
      );
    }
  }
});

test("sitemap leaves out unreviewed translations", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  for (const locale of prefixedLocales) {
    for (const path of ["", "/drivers", "/transporters"]) {
      const listed = xml.includes(`/${locale}${path}</loc>`);
      expect(listed, `/${locale}${path}`).toBe(translationReview[locale].reviewed);
    }
  }
});

test("gating: drafts are hidden from production builds unless previews are switched on", () => {
  const original = process.env.PREVIEW_UNREVIEWED_LOCALES;
  try {
    process.env.PREVIEW_UNREVIEWED_LOCALES = "false";
    for (const locale of prefixedLocales) {
      expect(isLocalePublished(locale)).toBe(translationReview[locale].reviewed);
    }
    process.env.PREVIEW_UNREVIEWED_LOCALES = "true";
    for (const locale of prefixedLocales) expect(isLocalePublished(locale)).toBe(true);
    expect(isLocalePublished("en")).toBe(true);
  } finally {
    if (original === undefined) delete process.env.PREVIEW_UNREVIEWED_LOCALES;
    else process.env.PREVIEW_UNREVIEWED_LOCALES = original;
  }
});

test("header language menu switches page and remembers the choice", async ({ page, context }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto("/transporters");
  const menu = page.getByRole("navigation", { name: "Language", exact: true });
  await menu.locator("summary").click();
  await menu.getByRole("link", { name: "தமிழ்" }).click();
  await expect(page).toHaveURL(/\/ta\/transporters$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ta-IN");

  const cookie = (await context.cookies()).find((c) => c.name === LOCALE_COOKIE);
  expect(cookie?.value).toBe("ta");

  // A returning visitor lands on their language.
  await page.goto("/drivers");
  await expect(page).toHaveURL(/\/ta\/drivers$/);

  // Choosing English again sticks too.
  await page.getByRole("navigation", { name: "மொழி", exact: true }).locator("summary").click();
  await page
    .getByRole("navigation", { name: "மொழி", exact: true })
    .getByRole("link", { name: "English" })
    .click();
  await expect(page).toHaveURL(/\/drivers$/);
  // Crossing root layouts (/ta → English) is a full page load; let it finish.
  await expect(page.locator("html")).toHaveAttribute("lang", "en-IN");
  await page.waitForLoadState("load");
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
});

test("footer language switcher works on a 360px phone", async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto("/");
  const footerSwitcher = page.getByRole("navigation", { name: "Choose your language" });
  await footerSwitcher.getByRole("link", { name: "हिन्दी" }).click();
  await expect(page).toHaveURL(/\/hi$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("ट्रक");
});

test("pages outside the translated set send the switcher to that language's home", async ({
  page,
}) => {
  await page.setViewportSize(MOBILE);
  await page.goto("/pricing");
  const footerSwitcher = page.getByRole("navigation", { name: "Choose your language" });
  await expect(footerSwitcher.getByRole("link", { name: "தமிழ்" })).toHaveAttribute("href", "/ta");
});

const imagePages = [
  "/",
  "/privacy",
  "/ta/transporters",
  "/shippers",
  "/transporters",
  "/drivers",
  "/trucks",
  "/trucks/lcv-14ft",
  "/pricing",
  "/how-it-works",
  "/hi",
  "/ta/drivers",
];

test("every image has alt text, a fixed aspect ratio and weighs under 200 KB", async ({ page }) => {
  test.slow();
  const sizes: { url: string; bytes: number }[] = [];
  page.on("response", async (response) => {
    const type = response.headers()["content-type"] ?? "";
    if (!type.startsWith("image/")) return;
    const body = await response.body().catch(() => null);
    if (body) sizes.push({ url: response.url(), bytes: body.length });
  });

  for (const path of imagePages) {
    await page.goto(path);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForLoadState("load");

    const problems = await page.evaluate(() => {
      const issues: string[] = [];
      for (const img of document.querySelectorAll("img")) {
        if (!img.hasAttribute("alt")) issues.push(`img without alt: ${img.src}`);
        const fixed =
          (img.hasAttribute("width") && img.hasAttribute("height")) ||
          getComputedStyle(img).aspectRatio !== "auto" ||
          (img.parentElement && getComputedStyle(img.parentElement).aspectRatio !== "auto");
        if (!fixed) issues.push(`img without a fixed ratio: ${img.src}`);
      }
      for (const svg of document.querySelectorAll("svg[data-truck-illustration]")) {
        const decorative = svg.getAttribute("aria-hidden") === "true";
        if (!decorative && !svg.getAttribute("aria-label")) {
          issues.push("truck illustration without a name");
        }
        const box = svg.getBoundingClientRect();
        if (box.width > 0 && Math.abs(box.width / box.height - 4 / 3) > 0.05) {
          issues.push(`truck illustration not 4:3 (${box.width}×${box.height})`);
        }
      }
      return issues;
    });
    expect(problems, path).toEqual([]);

    // Share image: present, described and light.
    const og = await page.locator('meta[property="og:image"]').first().getAttribute("content");
    expect(og, `${path} og:image`).toBeTruthy();
    await expect(page.locator('meta[property="og:image:alt"]').first()).toHaveAttribute(
      "content",
      /\S/,
    );
    const ogResponse = await page.request.get(new URL(og!).pathname);
    expect(ogResponse.headers()["content-type"]).toBe("image/png");
    sizes.push({ url: og!, bytes: (await ogResponse.body()).length });
  }

  const heavy = sizes.filter((image) => image.bytes >= 200 * 1024);
  expect(heavy).toEqual([]);
});

test("booking-flow loop: 10s cycle, pausable, and still under reduced motion", async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto("/");
  const how = page.locator("section", { has: page.locator("#how-title") });
  const phone = how.getByTestId("phone-mockup");
  await expect(phone).toBeVisible();

  const durations = await phone.evaluate((el) =>
    el
      .getAnimations({ subtree: true })
      .map((a) => (a.effect?.getTiming().duration as number) / 1000),
  );
  expect(durations.length).toBeGreaterThan(0);
  for (const seconds of durations) {
    expect(seconds).toBeGreaterThanOrEqual(6);
    expect(seconds).toBeLessThanOrEqual(10);
  }

  await how.getByRole("button", { name: "Pause animation" }).click();
  await expect(how.getByRole("button", { name: "Play animation" })).toBeVisible();
  const states = await phone.evaluate((el) =>
    [...el.querySelectorAll("*")]
      .filter((child) => getComputedStyle(child).animationName !== "none")
      .map((child) => getComputedStyle(child).animationPlayState),
  );
  expect(new Set(states)).toEqual(new Set(["paused"]));

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  const moving = await page.evaluate(() => document.getAnimations().length);
  expect(moving).toBe(0);
  await expect(how.getByRole("button", { name: "Pause animation" })).toBeHidden();
});

test("hero copy comes from the A/B variant keys (control live)", async ({ page }) => {
  for (const [path, selector] of [
    ["/", "#hero-title"],
    ["/shippers", "#page-title"],
    ["/transporters", "#page-title"],
  ] as const) {
    await page.goto(path);
    await expect(page.locator(`section:has(${selector})`)).toHaveAttribute(
      "data-hero-variant",
      "a",
    );
  }
});

test("dark theme: translated pages pass axe", async ({ page }) => {
  test.slow();
  await page.emulateMedia({ colorScheme: "dark" });
  for (const path of ["/hi", "/ta/transporters"]) {
    await page.goto(path);
    await settled(page);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((v) => `${path}: ${v.id}`)).toEqual([]);
  }
});
