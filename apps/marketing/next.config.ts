// Validates env at config load: `next dev` and `next build` fail fast.
import "./src/env.ts";

import { join } from "node:path";

import type { NextConfig } from "next";

import { legacyRedirects } from "./src/content/redirects.ts";
import { assertLaunchReady } from "./src/launch-check.ts";
import { securityHeaders } from "./src/lib/security-headers.ts";

// Production deploys need the company identity the footer shows (NFC-4).
assertLaunchReady();

const nextConfig: NextConfig = {
  // Self-contained server bundle, built only for the Docker image (the
  // Dockerfile sets BUILD_STANDALONE=1). Elsewhere a regular .next is smaller
  // to cache and restores cleanly from the Turborepo cache — standalone output
  // contains a copied node_modules with symlinks.
  ...(process.env.BUILD_STANDALONE === "1" ? { output: "standalone" as const } : {}),
  // Trace files from the monorepo root so workspace packages are included.
  outputFileTracingRoot: join(import.meta.dirname, "../.."),
  reactStrictMode: true,
  poweredByHeader: false,
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Truck photos/renders: modern formats, fixed 4:3 frames (no layout shift).
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
  experimental: {
    // ~12 KB of Tailwind CSS: inlining removes the render-blocking stylesheet
    // request for first-time mobile visitors (most of our traffic).
    inlineCss: true,
    // Two root layouts ((en), [locale]) → unmatched URLs use app/global-not-found.tsx.
    globalNotFound: true,
    // Subresource Integrity: every <script src> carries a sha256 hash, so a
    // tampered chunk on the CDN is refused by the browser (see SECURITY.md).
    sri: { algorithm: "sha256" },
  },
  turbopack: {
    root: join(import.meta.dirname, "../.."),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Old truckbuck.in URLs → new pages (NFC-20). Permanent, so rankings carry over.
  redirects() {
    return Promise.resolve(legacyRedirects.map((redirect) => ({ ...redirect, permanent: true })));
  },
  headers() {
    return Promise.resolve([
      // Staging and other Preview deployments: never indexed, whatever the page says.
      ...(process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production"
        ? [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }]
        : []),
      {
        source: "/:path*",
        headers: securityHeaders({
          isDev: process.env.NODE_ENV === "development",
          gtm: Boolean(process.env.NEXT_PUBLIC_GTM_ID),
        }),
      },
    ]);
  },
};

export default nextConfig;
