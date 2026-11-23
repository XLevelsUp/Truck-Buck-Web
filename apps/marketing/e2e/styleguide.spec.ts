import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

import { themes } from "@truckbuck/ui/tokens";

/** Resolves a token hex to the browser's computed form, for comparison with getComputedStyle. */
function computedColor(page: Page, hex: string) {
  return page.evaluate((value) => {
    const probe = document.createElement("div");
    probe.style.backgroundColor = value;
    document.body.append(probe);
    const result = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return result;
  }, hex);
}

const viewports = [
  { name: "360px", width: 360, height: 780 },
  { name: "1280px", width: 1280, height: 900 },
] as const;

const schemes = ["light", "dark"] as const;

for (const viewport of viewports) {
  for (const colorScheme of schemes) {
    test.describe(`/styleguide at ${viewport.name}, ${colorScheme}`, () => {
      test.use({ viewport, colorScheme });

      test("has zero axe violations", async ({ page }) => {
        await page.goto("/styleguide");
        await expect(page.getByRole("heading", { level: 1, name: "Styleguide" })).toBeVisible();

        // The theme really switched (tokens come from prefers-color-scheme).
        const background = await page.evaluate(() =>
          getComputedStyle(document.body).getPropertyValue("background-color"),
        );
        expect(background).toBe(await computedColor(page, themes[colorScheme].background));

        const results = await new AxeBuilder({ page }).analyze();
        expect(
          results.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            nodes: v.nodes.map((n) => n.target.join(" ")),
          })),
        ).toEqual([]);
      });

      test("never scrolls sideways", async ({ page }) => {
        await page.goto("/styleguide");
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);
      });
    });
  }
}

test("forced dark theme via data-theme also passes axe", async ({ page }) => {
  await page.goto("/styleguide");
  await page.getByRole("radio", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
});

test("open overlays pass axe and trap focus", async ({ page }) => {
  await page.goto("/styleguide");

  await page.getByRole("button", { name: "Open bottom sheet" }).click();
  const sheet = page.getByRole("dialog", { name: "Which truck do I need?" });
  await expect(sheet).toBeVisible();
  expect((await new AxeBuilder({ page }).include('[role="dialog"]').analyze()).violations).toEqual(
    [],
  );
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(page.getByRole("button", { name: "Open bottom sheet" })).toBeFocused();

  const combobox = page.getByRole("combobox", { name: "From" });
  await combobox.fill("ch");
  await expect(page.getByRole("listbox")).toBeVisible();
  expect(
    (await new AxeBuilder({ page }).include('[data-slot="combobox"]').analyze()).violations,
  ).toEqual([]);
});

test("brand assets are served with the right types", async ({ request }) => {
  const svg = await request.get("/brand/truckbuck-horizontal.svg");
  expect(svg.status()).toBe(200);
  expect(svg.headers()["content-type"]).toContain("image/svg+xml");
  expect(await svg.text()).toContain("<title>TruckBuck</title>");

  for (const png of ["icon-32.png", "apple-touch-icon.png", "icon-maskable-512.png"]) {
    const response = await request.get(`/brand/${png}`);
    expect(response.status(), png).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");
  }

  const manifest = (await (await request.get("/manifest.webmanifest")).json()) as {
    icons: { purpose?: string }[];
  };
  expect(manifest.icons.some((icon) => icon.purpose === "maskable")).toBe(true);

  expect((await request.get("/brand/unknown.svg")).status()).toBe(404);
});

test("styleguide is not indexed", async ({ page }) => {
  await page.goto("/styleguide");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});
