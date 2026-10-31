// Validates env at config load: `next dev` and `next build` fail fast.
import "./src/env.ts";

import { join } from "node:path";

import type { NextConfig } from "next";

import { securityHeaders } from "./src/lib/security-headers.ts";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image.
  output: "standalone",
  // Trace files from the monorepo root so workspace packages are included.
  outputFileTracingRoot: join(import.meta.dirname, "../.."),
  reactStrictMode: true,
  poweredByHeader: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    root: join(import.meta.dirname, "../.."),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  headers() {
    return Promise.resolve([
      {
        source: "/:path*",
        headers: securityHeaders({ isDev: process.env.NODE_ENV === "development" }),
      },
    ]);
  },
};

export default nextConfig;
