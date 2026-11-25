import { defineConfig, devices } from "@playwright/test";

// E2E_PORT lets tests run beside a local `next dev` that already holds :3000.
const PORT = Number(process.env.E2E_PORT ?? 3000);
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // axe runs are CPU-heavy; more local workers made timing-sensitive tests flaky.
  workers: isCI ? 2 : 3,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
    // Analytics consent already answered ("no"), so the consent banner doesn't
    // cover the page in older specs. e2e/phase9.spec.ts clears it to test the banner.
    storageState: {
      cookies: [
        {
          name: "tb_consent",
          value: "denied",
          domain: "localhost",
          path: "/",
          expires: -1,
          httpOnly: false,
          secure: false,
          sameSite: "Lax",
        },
      ],
      origins: [],
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Runs against the production build via `next start` (turbo runs `build` first).
  webServer: {
    command: `pnpm exec next start --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
