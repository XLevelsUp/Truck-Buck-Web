import { expect, test } from "@playwright/test";

test("redirects to login, signs in with the mock provider and shows the shell", async ({
  page,
}) => {
  await page.goto("/transporters");

  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("Email").fill("ops@truckbuck.in");
  await page.getByLabel("Password").fill("correct-horse");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/transporters$/);
  await expect(page.getByRole("heading", { level: 1, name: "Transporters" })).toBeVisible();

  const nav = page.getByRole("navigation", { name: "Main" });
  await nav.getByRole("link", { name: "Disputes" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Disputes" })).toBeVisible();
});

test("deep links survive a full reload (SPA fallback)", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Sign in to TruckBuck Admin" })).toBeVisible();
});
