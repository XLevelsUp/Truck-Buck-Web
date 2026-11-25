/**
 * Lighthouse CI: the build fails if any MOBILE category score drops below 95
 * on the pages the brief names. Runs against a production build (`next start`).
 *
 *   pnpm --filter @truckbuck/marketing build
 *   pnpm --filter @truckbuck/marketing lhci
 *
 * `is-crawlable` is skipped: city/lane pages are deliberately noindex until
 * their data is real (Phase 7), and scripts/check-seo.mjs already verifies
 * that every page in a sitemap is indexable.
 */
const base = process.env.LHCI_BASE_URL ?? "http://localhost:3200";

module.exports = {
  ci: {
    collect: {
      ...(process.env.LHCI_BASE_URL
        ? {}
        : {
            startServerCommand: "pnpm exec next start --port 3200",
            startServerReadyPattern: "Ready",
            startServerReadyTimeout: 60_000,
          }),
      url: [
        `${base}/`,
        `${base}/shippers`,
        `${base}/transporters`,
        `${base}/trucks/lcv-14ft`,
        `${base}/truck-booking/coimbatore-to-kochi`,
      ],
      numberOfRuns: 3,
      settings: {
        // Lighthouse's default mobile emulation (Moto G Power, slow 4G).
        formFactor: "mobile",
        skipAudits: ["is-crawlable"],
        chromeFlags: "--headless=new --no-sandbox",
      },
    },
    assert: {
      // Median of the runs per URL.
      aggregationMethod: "median-run",
      assertions: {
        "categories:performance": ["error", { minScore: 0.95 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["error", { minScore: 0.95 }],
        "categories:seo": ["error", { minScore: 0.95 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci",
    },
  },
};
