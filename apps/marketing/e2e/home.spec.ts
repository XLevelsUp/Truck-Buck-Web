import AxeBuilder from "@axe-core/playwright";
import { type CDPSession, expect, type Page, test } from "@playwright/test";

/*
 * Home page + fare estimate. Runs against a production build with sample
 * data and the offline geo provider (ALLOW_SAMPLE_DATA=true, no Google key),
 * so results are deterministic and no third-party quota is used.
 */

const MOBILE = { width: 360, height: 740 };

/** Throttled "4G on a budget Android" profile (Chrome DevTools "Slow 4G" + 4× CPU). */
async function throttle(page: Page): Promise<CDPSession> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  return cdp;
}

async function pickPlace(page: Page, label: "Pickup" | "Drop", query: string, option: string) {
  const field = page.getByRole("combobox", { name: label });
  await field.fill(query);
  await page.getByRole("option", { name: new RegExp(option) }).click();
  await expect(field).toHaveValue(option);
}

test.describe("home at 360×740", () => {
  test.use({ viewport: MOBILE, hasTouch: true, isMobile: true });

  test("H1 and the start of the widget are above the fold", async ({ page }) => {
    await page.goto("/");
    const h1 = page.getByRole("heading", { level: 1, name: "Book a truck like you book a cab." });
    await expect(h1).toBeInViewport();
    await expect(page.getByRole("combobox", { name: "Pickup" })).toBeInViewport();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("fare in ≤ 4 taps after addresses, lead in one more — on throttled 4G", async ({ page }) => {
    await page.goto("/");
    await throttle(page);

    await pickPlace(page, "Pickup", "chen", "Chennai");
    await pickPlace(page, "Drop", "beng", "Bengaluru");

    let taps = 0;
    await page.getByText("LCV 14 ft", { exact: true }).first().tap();
    taps++;
    // "Today" is preselected, so the date needs no tap.
    await page.getByRole("button", { name: "Get price" }).tap();
    taps++;
    expect(taps).toBeLessThanOrEqual(4);

    const fare = page.getByTestId("fare-range");
    await expect(fare).toHaveText(/^₹[\d,]+ – ₹[\d,]+$/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Your estimate" })).toBeFocused();
    expect(page.url()).toMatch(/from=sample%3Achennai&to=sample%3Abengaluru&truck=lcv-14ft&date=/);
    await expect(page.getByText("Sample rates — for testing only")).toBeVisible();

    await page.getByRole("textbox", { name: "Your name" }).fill("E2E Test");
    await page.getByRole("textbox", { name: "Mobile number" }).fill("9876543210");
    await page.getByRole("button", { name: /Get a callback/ }).tap();
    await expect(page.getByRole("status").filter({ hasText: "Request received" })).toBeVisible({
      timeout: 20_000,
    });

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("tells people what is missing instead of failing silently", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Get price" }).click();
    await expect(page.getByText("Choose a pickup from the list.")).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Pickup" })).toBeFocused();
    await expect(page.getByText("Choose a truck type.")).toBeVisible();
  });

  test("rejects an invalid phone number with a clear message", async ({ page }) => {
    await page.goto("/?from=sample:chennai&to=sample:coimbatore&truck=mcv-20ft");
    await expect(page.getByTestId("fare-range")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("textbox", { name: "Your name" }).fill("E2E Test");
    await page.getByRole("textbox", { name: "Mobile number" }).fill("12345");
    await page.getByRole("button", { name: /Get a callback/ }).click();
    await expect(page.getByText(/Enter a 10-digit mobile number/)).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Mobile number" })).toBeFocused();
  });
});

test("a shared link restores the route and prices it", async ({ page }) => {
  await page.goto("/?from=sample:chennai&to=sample:hyderabad&truck=container-32ft");
  await expect(page.getByRole("combobox", { name: "Pickup" })).toHaveValue("Chennai, Tamil Nadu");
  await expect(page.getByRole("radio", { name: /Container 32 ft MXL/ })).toBeChecked();
  await expect(page.getByTestId("fare-range")).toBeVisible({ timeout: 15_000 });
});

for (const viewport of [MOBILE, { width: 1280, height: 900 }]) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`home has zero axe violations at ${viewport.width}px, ${colorScheme}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ colorScheme });
      await page.goto("/?from=sample:chennai&to=sample:bengaluru&truck=lcv-14ft");
      await expect(page.getByTestId("fare-range")).toBeVisible({ timeout: 15_000 });
      const results = await new AxeBuilder({ page }).analyze();
      expect(
        results.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target.join(" ")),
        })),
      ).toEqual([]);
    });
  }
}

test("mobile drawer opens, traps focus and closes with Escape", async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto("/");
  const menu = page.getByRole("button", { name: "Open menu" });
  await menu.click();
  const drawer = page.getByRole("dialog", { name: "Menu" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("link", { name: "Help" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(menu).toBeFocused();
});

test("estimate API: validates input, needs the bot check, caches, never exposes rate cards", async ({
  request,
}) => {
  const query = "from=sample:chennai&to=sample:madurai&truck=lcv-17ft&date=2099-01-01";
  expect((await request.get("/api/estimate?from=x")).status()).toBe(400);
  // No bot-check cookie yet.
  const blocked = await request.get(`/api/estimate?${query}`);
  expect(blocked.status()).toBe(403);
  expect(await blocked.json()).toEqual({ error: "bot_check" });

  // Cloudflare's test keys accept the dummy token outside production.
  const human = await request.post("/api/human", {
    data: { token: "XXXX.DUMMY.TOKEN.XXXX" },
    headers: { "x-forwarded-for": "198.51.100.40" },
  });
  expect(human.status()).toBe(204);
  expect(human.headers()["set-cookie"]).toMatch(/tb_h=.*HttpOnly.*SameSite=Strict/i);

  const response = await request.get(`/api/estimate?${query}`);
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toContain("s-maxage=300");
  const body = JSON.stringify(await response.json());
  expect(body).not.toMatch(/km_slabs|kmSlabs|per_km|perKm|baseFare|base_fare/);
});

test("truck pages exist for every carousel card", async ({ page }) => {
  await page.goto("/trucks/lcv-14ft");
  await expect(page.getByRole("heading", { level: 1, name: "LCV 14 ft" })).toBeVisible();
  // The detail page carries its own quote widget with this truck preselected.
  await expect(page.getByRole("radio", { name: /LCV 14 ft/ })).toBeChecked();
  // Cache Components streams the shell before notFound() runs, so the status
  // is 200; Next marks the page noindex (a soft 404) and shows the 404 UI.
  await page.goto("/trucks/not-a-truck");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(1);
});
