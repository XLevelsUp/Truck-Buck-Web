import { expect, test } from "@playwright/test";

test("home page renders with SEO essentials and security headers", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  expect(response?.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(response?.headers()["x-frame-options"]).toBe("DENY");

  await expect(page).toHaveTitle(/TruckBuck/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Get the driver app" }).first()).toHaveAttribute(
    "href",
    /^https:\/\/play\.google\.com\//,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /^https?:\/\/[^/]+\/?$/,
  );

  const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
  // Nodes may be wrapped in a schema.org @graph.
  const types = jsonLd.flatMap((text) => {
    const data = JSON.parse(text) as { "@type"?: string; "@graph"?: { "@type": string }[] };
    return data["@graph"] ? data["@graph"].map((node) => node["@type"]) : [data["@type"]];
  });
  expect(types).toEqual(expect.arrayContaining(["Organization", "FAQPage"]));
});

test("legal pages are reachable from the footer", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("contentinfo").getByRole("link", { name: "Privacy" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Privacy Policy" })).toBeVisible();
});

test("unknown routes return the 404 page", async ({ page }) => {
  const response = await page.goto("/does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});
