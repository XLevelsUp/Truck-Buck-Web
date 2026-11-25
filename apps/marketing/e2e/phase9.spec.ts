import { type BrowserContext, expect, type Page, test } from "@playwright/test";

import { sanitize } from "../src/lib/analytics";
import { coarsePlace } from "../src/lib/places";

/*
 * Phase 9: consent-gated analytics, PII-free events, attribution, the
 * estimate log, A/B variants, the exit prompt and the summary cron guard.
 * Local builds use a fake container (GTM-E2ETEST); every request to Google
 * Tag Manager is blocked and counted here, so nothing leaves the machine.
 */

const MOBILE = { width: 360, height: 740 };

async function blockGtm(context: BrowserContext) {
  const hits: string[] = [];
  await context.route(/googletagmanager\.com|google-analytics\.com|clarity\.ms/, (route) => {
    hits.push(route.request().url());
    return route.abort();
  });
  return hits;
}

async function setConsent(context: BrowserContext, value: "granted" | "denied" | null) {
  await context.clearCookies({ name: "tb_consent" });
  if (value) {
    await context.addCookies([{ name: "tb_consent", value, domain: "localhost", path: "/" }]);
  }
}

const dataLayer = (page: Page) =>
  page.evaluate(() =>
    (window.dataLayer ?? []).filter(
      (entry): entry is Record<string, unknown> =>
        typeof entry === "object" && entry !== null && "event" in entry,
    ),
  );

async function pickPlace(page: Page, label: "Pickup" | "Drop", query: string, option: string) {
  const field = page.getByRole("combobox", { name: label });
  await field.fill(query);
  await page.getByRole("option", { name: new RegExp(option) }).click();
}

/* ------------------------------------------------------------------------ */
/* Consent                                                                  */
/* ------------------------------------------------------------------------ */

test("GTM loads only after Accept; the choice sticks and can be changed", async ({
  page,
  context,
}) => {
  const hits = await blockGtm(context);
  await setConsent(context, null);
  await page.goto("/");
  const banner = page.getByTestId("consent-banner");
  await expect(banner).toBeVisible();
  await expect(banner.getByRole("link", { name: "Privacy policy" })).toHaveAttribute(
    "href",
    "/privacy",
  );
  expect(hits).toEqual([]);

  await banner.getByRole("button", { name: "Accept analytics" }).click();
  await expect(banner).toBeHidden();
  await expect.poll(() => hits.filter((u) => u.includes("gtm.js?id=GTM-E2ETEST")).length).toBe(1);
  const cookies = await context.cookies();
  expect(cookies.find((c) => c.name === "tb_consent")?.value).toBe("granted");
  expect(cookies.find((c) => c.name === "tb_cid")?.value).toMatch(/^\d+\.\d+$/);
  // Consent Mode: ads stay denied.
  const consentCall = await page.evaluate(() =>
    JSON.stringify((window.dataLayer ?? []).find((e) => (e as IArguments)[0] === "consent")),
  );
  expect(consentCall).toContain('"ad_storage":"denied"');

  await page.reload();
  await expect(page.getByTestId("consent-banner")).toBeHidden();

  // Footer "Cookie settings" reopens the choice; "No thanks" removes the analytics id.
  await page.getByRole("button", { name: "Cookie settings" }).click();
  await page.getByTestId("consent-banner").getByRole("button", { name: "No thanks" }).click();
  const after = await context.cookies();
  expect(after.find((c) => c.name === "tb_consent")?.value).toBe("denied");
  expect(after.find((c) => c.name === "tb_cid")).toBeUndefined();
});

test("rejecting analytics loads nothing and sends no events", async ({ page, context }) => {
  const hits = await blockGtm(context);
  await setConsent(context, null);
  await page.goto("/");
  await page.getByTestId("consent-banner").getByRole("button", { name: "No thanks" }).click();
  await page.getByRole("combobox", { name: "Pickup" }).focus();
  await page.reload();
  expect(hits).toEqual([]);
  expect(await dataLayer(page)).toEqual([]);
});

test("events wait for the choice: queued before Accept, sent after", async ({ page, context }) => {
  await blockGtm(context);
  await setConsent(context, null);
  await page.goto("/");
  await page.getByRole("combobox", { name: "Pickup" }).focus();
  expect((await dataLayer(page)).map((e) => e.event)).not.toContain("estimate_started");
  await page
    .getByTestId("consent-banner")
    .getByRole("button", { name: "Accept analytics" })
    .click();
  await expect
    .poll(async () => (await dataLayer(page)).map((e) => e.event))
    .toEqual(expect.arrayContaining(["page_view", "estimate_started"]));
});

/* ------------------------------------------------------------------------ */
/* Funnel, attribution, PII                                                 */
/* ------------------------------------------------------------------------ */

test.describe(() => {
  test.use({ extraHTTPHeaders: { "x-forwarded-for": "198.51.100.91" } });

  test("estimate → callback funnel: every step tracked, no PII, attribution on the lead", async ({
    page,
    context,
  }) => {
    await blockGtm(context);
    await setConsent(context, "granted");
    const estimateLog: string[] = [];
    const actionBodies: string[] = [];
    page.on("request", (request) => {
      if (request.url().endsWith("/api/events")) estimateLog.push(request.postData() ?? "");
      if (request.method() === "POST" && request.headers()["next-action"]) {
        actionBodies.push(request.postData() ?? "");
      }
    });

    await page.goto("/?utm_source=e2e&utm_medium=qa&utm_campaign=phase9");
    await pickPlace(page, "Pickup", "chen", "Chennai");
    await pickPlace(page, "Drop", "beng", "Bengaluru");
    await page.getByText("LCV 14 ft", { exact: true }).first().click();
    await page.getByRole("button", { name: "Get price" }).click();
    await expect(page.getByTestId("fare-range")).toBeVisible({ timeout: 20_000 });

    await page.getByRole("textbox", { name: "Your name" }).fill("Priya Raman");
    await page.getByRole("textbox", { name: "Mobile number" }).fill("9876543210");
    await page.getByRole("button", { name: /Get a callback/ }).click();
    await expect(page.getByRole("status").filter({ hasText: "Request received" })).toBeVisible({
      timeout: 20_000,
    });

    const events = await dataLayer(page);
    const names = events.map((e) => e.event);
    for (const step of [
      "page_view",
      "estimate_started",
      "estimate_address_entered",
      "estimate_truck_selected",
      "estimate_shown",
      "callback_submitted",
    ]) {
      expect(names, step).toContain(step);
    }
    const shown = events.find((e) => e.event === "estimate_shown")!;
    expect(shown).toMatchObject({ truck: "lcv-14ft", served: true });
    expect(typeof shown.distance_km).toBe("number");

    // No name, phone or place names reach analytics.
    const sent = JSON.stringify(events);
    for (const pii of ["Priya", "Raman", "9876543210", "98765", "Chennai", "Bengaluru"]) {
      expect(sent, pii).not.toContain(pii);
    }

    // Anonymous estimate log fired (places are cut to city level on the server).
    expect(estimateLog.some((body) => body.includes('"outcome":"shown"'))).toBe(true);

    // First-touch attribution travels with the lead (not with analytics).
    const lead = actionBodies.find((body) => body.includes("Priya Raman")) ?? "";
    expect(lead).toContain('"utm_source":"e2e"');
    expect(lead).toContain('"landing_path":"/"');
  });
});

test("analytics guard drops unknown params and anything that looks like a phone or email", () => {
  const cleaned = sanitize("whatsapp_clicked", {
    page: "call me on 98765 43210",
    placement: "a@b.co",
    // @ts-expect-error — not in the taxonomy, must be stripped
    name: "Priya",
  });
  expect(cleaned).toEqual({});
  expect(sanitize("estimate_failed", { reason: "no_route", truck: "lcv-14ft" })).toEqual({
    reason: "no_route",
    truck: "lcv-14ft",
  });
});

test("estimate log keeps places at city level", async ({ request }) => {
  expect(coarsePlace("12, Anna Salai, T. Nagar, Chennai, Tamil Nadu 600017, India")).toBe(
    "Chennai, Tamil Nadu",
  );
  expect(coarsePlace("Coimbatore, Tamil Nadu")).toBe("Coimbatore, Tamil Nadu");
  // Bad input is ignored quietly (beacons never retry).
  expect((await request.post("/api/events", { data: { outcome: "nope" } })).status()).toBe(204);
});

/* ------------------------------------------------------------------------ */
/* A/B tests                                                                */
/* ------------------------------------------------------------------------ */

test("A/B: forced variants render statically, stick via cookie, keep the canonical", async ({
  page,
  context,
}) => {
  await page.goto("/?exp=hero:b,cta:book_truck,widget_order:truck_first");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "See the truck fare before you book.",
  );
  await expect(page.getByRole("button", { name: "Book a truck" })).toBeVisible();
  // Truck-first: the truck group comes before Pickup in the DOM (and focus order).
  const order = await page.evaluate(() => {
    const form = document.querySelector("#get-price form")!;
    const truck = form.querySelector('input[name="truck"]')!;
    const pickup = form.querySelector("#estimate-from")!;
    return truck.compareDocumentPosition(pickup) & Node.DOCUMENT_POSITION_FOLLOWING;
  });
  expect(order).toBeTruthy();
  // Canonical is the real page, never the internal /x/ variant route.
  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  expect(new URL(canonical!).pathname).toBe("/");
  expect((await context.cookies()).find((c) => c.name === "tb_exp_qa")?.value).toBe(
    "hero.b~cta.book_truck~widget_order.truck_first",
  );

  // QA forcing sticks for the session, on the other test pages too.
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "See the truck fare before you book.",
  );
  await page.goto("/shippers");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Stop calling brokers for every load.",
  );
});

test("A/B: crawlers and test browsers without a cookie get the control", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Book a truck like you book a cab.",
  );
  await expect(page.getByRole("button", { name: "Get price" })).toBeVisible();
});

/* ------------------------------------------------------------------------ */
/* Exit prompt, cron                                                        */
/* ------------------------------------------------------------------------ */

async function triggerExitIntent(page: Page) {
  await page.clock.fastForward(9_000);
  await page.evaluate(() =>
    document.dispatchEvent(new MouseEvent("mouseout", { clientY: -1, bubbles: true })),
  );
}

test("exit prompt: desktop only, once per session, never on phones", async ({ browser }) => {
  const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await desktop.clock.install();
  await desktop.goto("/pricing");
  const dialog = desktop.getByTestId("exit-prompt");
  test.skip((await dialog.count()) === 0, "NEXT_PUBLIC_WHATSAPP_NUMBER not set in this build");
  await triggerExitIntent(desktop);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("link", { name: /quote on WhatsApp/ })).toHaveAttribute(
    "href",
    /^https:\/\/wa\.me\//,
  );
  await desktop.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await triggerExitIntent(desktop);
  await expect(dialog).toBeHidden(); // once per session
  await desktop.close();

  const phone = await browser.newPage({ viewport: MOBILE, isMobile: true, hasTouch: true });
  await phone.clock.install();
  await phone.goto("/pricing");
  await triggerExitIntent(phone);
  await expect(phone.getByTestId("exit-prompt")).toBeHidden();
  await phone.close();
});

test("weekly summary cron refuses calls without the Vercel cron secret", async ({ request }) => {
  expect((await request.get("/api/cron/weekly-summary")).status()).toBe(401);
  expect(
    (
      await request.get("/api/cron/weekly-summary", {
        headers: { Authorization: "Bearer wrong" },
      })
    ).status(),
  ).toBe(401);
});
