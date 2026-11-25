# Performance: marketing site

## Budgets and how they're enforced

| Check                               | Where it runs                                                 | Rule                                                                                                                                                                   |
| ----------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JS budget                           | `e2e/perf.spec.ts` → `scripts/check-bundle.mjs`               | Our JS beyond the framework baseline must be ≤ **80 KB** gzipped on every page. No third-party `<script src>` at load. Totals are reported against the brief's 120 KB. |
| Fonts                               | `e2e/perf.spec.ts`                                            | English pages download one font file (Geist Latin).                                                                                                                    |
| No third parties before interaction | `e2e/perf.spec.ts`                                            | No Google Maps or Cloudflare requests on page load.                                                                                                                    |
| Lighthouse                          | `pnpm --filter @truckbuck/marketing lhci` (manual, not in CI) | Mobile ≥ 95 in all four categories on `/`, `/shippers`, `/transporters`, `/trucks/lcv-14ft`, `/truck-booking/coimbatore-to-kochi`.                                     |
| Real users                          | `/api/vitals` → `web_vitals` table; `monitoring.yml` daily    | Mobile p75: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 (with at least 50 samples).                                                                                           |

Run locally against a production build on port 3200:

```
pnpm --filter @truckbuck/marketing build
pnpm --filter @truckbuck/marketing exec next start --port 3200
node apps/marketing/scripts/check-bundle.mjs
node apps/marketing/scripts/check-seo.mjs
CHROME_PATH=<a Chromium> LHCI_BASE_URL=http://localhost:3200 pnpm --filter @truckbuck/marketing lhci
```

The bundle analyzer is built into Next 16 for Turbopack: run `pnpm --filter @truckbuck/marketing analyze`. `@next/bundle-analyzer` only works with webpack.

## Measured in Phase 8 (local production build)

**JavaScript, gzipped** (`noModule` polyfills excluded, because modern browsers skip them):

|                                                                        | KB                    |
| ---------------------------------------------------------------------- | --------------------- |
| Framework baseline: React 19 + Next.js 16 router, loaded by every page | **129**               |
| Most pages, total                                                      | 170–175 (ours: 41–46) |
| `/trucks`, total (truck advisor and catalogue)                         | 203 (ours: 74)        |

**The 120 KB total in the brief can't be met on this stack**, because the framework alone is 129 KB. So the build enforces our share, and the totals stay visible in the report.

**Lighthouse mobile** (simulated throttling, on a machine with benchmark index about 2,400):

| Category                           | Score                 |
| ---------------------------------- | --------------------- |
| Accessibility, best practices, SEO | 100 on all five pages |
| Performance                        | median 93–95          |

- LCP is about 1.0 s and CLS is 0.
- What's left is Total Blocking Time, about 300 ms. That's one evaluation of the React runtime (~190 ms at 4× CPU slowdown) plus layout work. Scores move ±5 with machine load.
- Lighthouse was left out of CI at the client's request (Phase 8).

## What Phase 8 changed

- **Fonts:** both Noto faces' unicode-ranges include ₹ (U+20B9), and Geist's Latin subset doesn't. Every English page showing a price was downloading the ~120 KB Devanagari font, plus the Tamil one. The Noto fonts are now in the font stack only inside `lang="hi"`/`lang="ta"` content. Language names in the switcher use the system font.
- **Turnstile:** loads on first use of a form, not on page load.
- **Estimate endpoint:** a GET that can be cached for 5 minutes per identical input (CDN, plus the server's `use cache`). It's guarded by a bot-check cookie, so caching doesn't need a per-request token.
- **Already in place before Phase 8:**
  - Static/ISR pages and inlined CSS.
  - `next/font` with `display: swap`.
  - AVIF/WebP images with fixed frames.
  - The fare result and lead form load on demand.
  - A static map image until someone taps it.
  - No Maps JavaScript at all: Places goes through `/api/places`.
- **Date picker:** not lazy-loaded. It's about 1 KB gzipped and renders in the first paint, so splitting it out would add a request without saving bytes.
