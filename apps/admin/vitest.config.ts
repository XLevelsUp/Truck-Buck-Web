import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Kept separate from vite.config.ts so tests never depend on a local .env file.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": resolve(import.meta.dirname, "src") },
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    env: {
      VITE_API_BASE_URL: "http://localhost:4000/v1",
      VITE_APP_ENV: "test",
    },
    coverage: {
      provider: "v8",
      include: ["src/**"],
      exclude: ["src/test/**", "src/main.tsx"],
      reporter: ["text-summary", "lcov", "json-summary"],
    },
  },
});
