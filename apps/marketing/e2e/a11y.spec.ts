import AxeBuilder from "@axe-core/playwright";
import { type APIRequestContext, expect, type Locator, type Page, test } from "@playwright/test";

import { allSitemapXml } from "./sitemaps";

/*
 * Phase 8 accessibility gate (WCAG 2.2 AA):
 *   1. axe on EVERY route (all sitemaps + noindex city/lane pages + the
 *      hi/ta pages + a 404), at 360px and 1280px, including target size.
 *   2. Keyboard-only runs of the estimate widget and every form: no mouse,
 *      no clicks, Tab / arrows / Space / Enter only.
 *   3. Errors are announced through live regions; reduced motion stops
 *      every animation.
 */

const WCAG_22_AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];
const MOBILE = { width: 360, height: 740 };
const DESKTOP = { width: 1280, height: 900 };

async function everyRoute(request: APIRequestContext): Promise<string[]> {
  const xml = await allSitemapXml(request);
  const paths = new Set(
    [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]!).pathname),
  );
  const hub = await (await request.get("/truck-booking")).text();
  paths.add("/truck-booking");
  for (const m of hub.matchAll(/href="(\/truck-booking\/[a-z0-9-]+)"/g)) paths.add(m[1]!);
  for (const locale of ["hi", "ta"]) {
    for (const path of ["", "/drivers", "/transporters"]) paths.add(`/${locale}${path}`);
  }
  paths.add("/no-such-page");
  return [...paths].sort();
}

for (const viewport of [MOBILE, DESKTOP]) {
  test(`every route passes axe (WCAG 2.2 AA) at ${viewport.width}px`, async ({ page, request }) => {
    test.setTimeout(10 * 60_000);
    await page.setViewportSize(viewport);
    // Looping illustrations fade text in and out; axe would sample a frame
    // mid-fade. Under reduced motion they hold still (a separate test below
    // checks that reduced motion really stops everything).
    await page.emulateMedia({ reducedMotion: "reduce" });
    const routes = await everyRoute(request);
    expect(routes.length).toBeGreaterThan(60);
    const violations: string[] = [];
    for (const path of routes) {
      // networkidle ≈ hydrated: controls that wait for the client (the date
      // picker's "Today" chip needs the IST date) are enabled by then.
      await page.goto(path, { waitUntil: "networkidle" });
      // Let colour transitions (e.g. a prefilled truck chip turning "checked"
      // after hydration) finish, so axe doesn't sample a half-blended frame.
      await page.waitForFunction(() =>
        document.getAnimations().every((a) => a.playState !== "running"),
      );
      const results = await new AxeBuilder({ page }).withTags(WCAG_22_AA).analyze();
      for (const v of results.violations) {
        violations.push(`${path} ${v.id}: ${v.nodes[0]?.target.join(" ")}`);
      }
    }
    expect(violations).toEqual([]);
  });
}

/* ------------------------------------------------------------------------ */
/* Keyboard-only helpers                                                    */
/* ------------------------------------------------------------------------ */

const isFocused = (target: Locator) =>
  target.evaluate((el) => el === document.activeElement).catch(() => false);

/** Presses Tab until `target` has focus (fails after `max` presses). */
async function tabTo(page: Page, target: Locator, max = 120) {
  for (let i = 0; i < max; i++) {
    if (await isFocused(target)) return;
    await page.keyboard.press("Tab");
  }
  throw new Error(`Never reached ${target.toString()} with Tab`);
}

/** Tabs into a radio group, then uses the arrow keys to check `target`. */
async function chooseRadio(page: Page, target: Locator, max = 120) {
  const name = await target.getAttribute("name");
  for (let i = 0; i < max; i++) {
    const inGroup = await page.evaluate(
      (n) => (document.activeElement as HTMLInputElement | null)?.name === n,
      name,
    );
    if (inGroup) break;
    await page.keyboard.press("Tab");
  }
  for (let i = 0; i < 12 && !(await target.isChecked()); i++) {
    await page.keyboard.press("ArrowRight");
  }
  await expect(target).toBeChecked();
}

async function typeInto(page: Page, target: Locator, text: string) {
  await tabTo(page, target);
  await page.keyboard.type(text);
}

async function pressButton(page: Page, target: Locator) {
  await tabTo(page, target);
  await page.keyboard.press("Enter");
}

/** Mouse use fails the test: keyboard-only means keyboard-only. */
async function forbidPointer(page: Page) {
  await page.addInitScript(() => {
    window.addEventListener(
      "pointerdown",
      (event) => {
        if (event.isTrusted) throw new Error("pointer used in a keyboard-only test");
      },
      true,
    );
  });
}

/* ------------------------------------------------------------------------ */
/* Estimate widget                                                          */
/* ------------------------------------------------------------------------ */

test.describe(() => {
  test.use({ extraHTTPHeaders: { "x-forwarded-for": "198.51.100.81" } });

  test("estimate widget and callback form work with the keyboard alone", async ({ page }) => {
    await forbidPointer(page);
    await page.goto("/");

    for (const [label, query, option] of [
      ["Pickup", "chen", "Chennai"],
      ["Drop", "beng", "Bengaluru"],
    ] as const) {
      const field = page.getByRole("combobox", { name: label });
      await typeInto(page, field, query);
      await expect(page.getByRole("option", { name: new RegExp(option) }).first()).toBeVisible();
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");
      await expect(field).toHaveValue(new RegExp(option));
    }

    await chooseRadio(page, page.getByRole("radio", { name: /LCV 14 ft/ }));
    await pressButton(page, page.getByRole("button", { name: "Get price" }));

    await expect(page.getByTestId("fare-range")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Your estimate" })).toBeFocused();

    await typeInto(page, page.getByRole("textbox", { name: "Your name" }), "Keyboard Only");
    await typeInto(page, page.getByRole("textbox", { name: "Mobile number" }), "9876543210");
    await pressButton(page, page.getByRole("button", { name: /Get a callback/ }));
    await expect(page.getByRole("status").filter({ hasText: "Request received" })).toBeVisible({
      timeout: 20_000,
    });
  });
});

test("estimate widget errors are announced and focus moves to the first problem", async ({
  page,
}) => {
  await page.goto("/");
  await pressButton(page, page.getByRole("button", { name: "Get price" }));
  const pickup = page.getByRole("combobox", { name: "Pickup" });
  await expect(pickup).toBeFocused();
  await expect(pickup).toHaveAttribute("aria-invalid", "true");
  // The message sits in a live region, so it is read out as it appears.
  const live = page.locator('[aria-live="polite"]', { hasText: "Choose a pickup from the list." });
  await expect(live).toHaveCount(1);
  const describedBy = await pickup.getAttribute("aria-describedby");
  await expect(page.locator(`#${describedBy!.split(" ").pop()}`)).toHaveText(
    "Choose a pickup from the list.",
  );
});

/* ------------------------------------------------------------------------ */
/* Every form, keyboard only                                                */
/* ------------------------------------------------------------------------ */

test.describe(() => {
  test.use({ extraHTTPHeaders: { "x-forwarded-for": "198.51.100.82" } });

  test("shippers: business account form, keyboard only", async ({ page }) => {
    await forbidPointer(page);
    await page.goto("/shippers");
    const form = page.locator("#business-account");
    await typeInto(page, form.getByRole("textbox", { name: "Company name" }), "Keyboard Traders");
    await typeInto(page, form.getByRole("textbox", { name: /GSTIN/ }), "27AAPFU0939F1ZV");
    await chooseRadio(page, form.getByRole("radio", { name: "6–20" }));
    await typeInto(page, form.getByRole("textbox", { name: "Your usual routes" }), "Chennai");
    await typeInto(page, form.getByRole("textbox", { name: "Your name" }), "Keyboard Buyer");
    await typeInto(page, form.getByRole("textbox", { name: "Mobile number" }), "9876543210");
    await pressButton(page, form.getByRole("button", { name: "Request a call" }));
    await expect(form.getByRole("status").filter({ hasText: "we'll call you" })).toBeVisible({
      timeout: 20_000,
    });
  });
});

test.describe(() => {
  test.use({ extraHTTPHeaders: { "x-forwarded-for": "198.51.100.83" } });

  test("transporters: two-step application, keyboard only", async ({ page }) => {
    await forbidPointer(page);
    await page.goto("/transporters");
    const form = page.locator("#apply");
    await typeInto(page, form.getByRole("textbox", { name: "Owner's name" }), "Keyboard Fleet");
    await typeInto(page, form.getByRole("textbox", { name: "Mobile number" }), "9876543210");
    await typeInto(page, form.getByRole("textbox", { name: "City" }), "Chennai");
    await pressButton(page, form.getByRole("button", { name: "Next" }));

    // Step change moves focus to the new step's heading.
    await expect(form.getByRole("heading", { name: "Your fleet" })).toBeFocused({
      timeout: 10_000,
    });
    await chooseRadio(page, form.getByRole("radio", { name: "2–5" }));
    const lcv = form.getByRole("checkbox", { name: "LCV 14 ft" });
    await tabTo(page, lcv);
    await page.keyboard.press("Space");
    await expect(lcv).toBeChecked();
    await typeInto(page, form.getByRole("textbox", { name: "Home base" }), "Chennai");
    await pressButton(page, form.getByRole("button", { name: "Send application" }));
    await expect(form.getByRole("status").filter({ hasText: "Application received" })).toBeVisible({
      timeout: 20_000,
    });
  });
});

test.describe(() => {
  test.use({ extraHTTPHeaders: { "x-forwarded-for": "198.51.100.84" } });

  test("drivers: rewards waitlist, keyboard only", async ({ page }) => {
    await forbidPointer(page);
    await page.goto("/drivers");
    const form = page.locator("#rewards");
    await typeInto(page, form.getByRole("textbox", { name: "Your name" }), "Keyboard Driver");
    await typeInto(page, form.getByRole("textbox", { name: "Mobile number" }), "9876543210");
    await typeInto(page, form.getByRole("textbox", { name: "City" }), "Coimbatore");
    await pressButton(page, form.getByRole("button", { name: "Join the waitlist" }));
    await expect(form.getByRole("status")).toContainText("You're on the waitlist", {
      timeout: 20_000,
    });
  });
});

test.describe(() => {
  test.use({ extraHTTPHeaders: { "x-forwarded-for": "198.51.100.85" } });

  test("contact: support form, keyboard only", async ({ page }) => {
    await forbidPointer(page);
    await page.goto("/contact");
    const form = page.locator("form");
    await chooseRadio(page, form.getByRole("radio", { name: "Press or partnership" }));
    await typeInto(
      page,
      form.getByRole("textbox", { name: "Your message" }),
      "Typed with the keyboard only.",
    );
    await typeInto(page, form.getByRole("textbox", { name: "Your name" }), "Keyboard Press");
    await typeInto(page, form.getByRole("textbox", { name: "Mobile number" }), "9876543210");
    await pressButton(page, form.getByRole("button", { name: "Send message" }));
    await expect(page.getByRole("status").filter({ hasText: "Message received" })).toBeVisible({
      timeout: 20_000,
    });
  });
});

test.describe(() => {
  test.use({ extraHTTPHeaders: { "x-forwarded-for": "198.51.100.86" } });

  test("grievance: request form, keyboard only", async ({ page }) => {
    await forbidPointer(page);
    await page.goto("/grievance");
    const form = page.locator("#request form");
    await chooseRadio(page, form.getByRole("radio", { name: "Delete my data" }));
    await typeInto(
      page,
      form.getByRole("textbox", { name: "Your message" }),
      "Please delete my callback details.",
    );
    await typeInto(page, form.getByRole("textbox", { name: "Your name" }), "Keyboard Person");
    await typeInto(page, form.getByRole("textbox", { name: "Mobile number" }), "9876543210");
    await pressButton(page, form.getByRole("button", { name: "Submit request" }));
    await expect(page.getByRole("status").filter({ hasText: "Request received" })).toBeVisible({
      timeout: 20_000,
    });
  });
});

test("form errors are announced in live regions and tied to their fields", async ({ page }) => {
  await page.goto("/contact");
  const form = page.locator("form");
  await pressButton(page, form.getByRole("button", { name: "Send message" }));
  const message = form.getByRole("textbox", { name: "Your message" });
  await expect(message).toHaveAttribute("aria-invalid", "true");
  const errorText = "Tell us a little more (at least 10 characters).";
  await expect(form.locator('[aria-live="polite"]', { hasText: errorText })).toHaveCount(1);
  const describedBy = (await message.getAttribute("aria-describedby"))!.split(" ");
  await expect(page.locator(`#${describedBy.at(-1)}`)).toHaveText(errorText);
});

/* ------------------------------------------------------------------------ */
/* Motion, targets, labels                                                  */
/* ------------------------------------------------------------------------ */

test("prefers-reduced-motion stops every animation and hides the pause buttons", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const path of ["/", "/transporters", "/how-it-works", "/drivers"]) {
    await page.goto(path);
    const running = await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter((a) => a.playState === "running" && Number(a.effect?.getTiming().duration) > 0)
          .length,
    );
    expect(running, path).toBe(0);
    await expect(page.getByRole("button", { name: /^Pause/ })).toHaveCount(0);
  }
});

test("interactive targets are at least 24×24 CSS px (WCAG 2.5.8)", async ({ page }) => {
  await page.setViewportSize(MOBILE);
  for (const path of ["/", "/shippers", "/transporters", "/contact", "/trucks/lcv-14ft"]) {
    await page.goto(path);
    const small = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("a, button, input, select, textarea, summary")]
        .filter((el) => {
          const style = getComputedStyle(el);
          if (style.visibility === "hidden" || style.display === "none") return false;
          // sr-only inputs (chips) are activated through their visible label.
          if (el.matches("input") && el.closest("label")) return false;
          const rect = el.getBoundingClientRect();
          // Visually hidden until focused (skip link, sr-only): not a pointer target.
          if (rect.width <= 1 || rect.height <= 1) return false;
          // Inline links inside running text are exempt (2.5.8 "inline" exception).
          if (el.matches("a") && style.display === "inline") return false;
          return rect.width < 24 || rect.height < 24;
        })
        .map((el) => `${el.tagName.toLowerCase()} "${(el.textContent ?? "").trim().slice(0, 30)}"`),
    );
    expect(small, path).toEqual([]);
  }
});

test("truck chips, map and steps have accessible names", async ({ page }) => {
  await page.goto("/?from=sample:chennai&to=sample:madurai&truck=lcv-14ft");
  // Truck chips: a labelled radio group.
  await expect(page.getByRole("group", { name: /Truck/ })).toBeVisible();
  await expect(page.getByRole("radio", { name: /LCV 14 ft/ })).toBeChecked();
  await expect(page.getByTestId("fare-range")).toBeVisible({ timeout: 20_000 });
  // Route map: a labelled figure (the image inside is decorative, alt="").
  await expect(page.locator('figure[data-slot="map-container"]')).toHaveAttribute(
    "aria-label",
    /.+/,
  );

  // Transporter application stepper: current step is exposed to assistive tech.
  await page.goto("/transporters");
  await expect(page.locator('#apply [aria-current="step"]')).toHaveCount(1);
});
