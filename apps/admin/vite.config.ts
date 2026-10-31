import { resolve } from "node:path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

import { parseEnv } from "./src/env.schema.ts";

export default defineConfig(({ mode }) => {
  // Fail fast: `vite` and `vite build` refuse to start with a bad env.
  parseEnv(loadEnv(mode, import.meta.dirname, "VITE_"));

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { "@": resolve(import.meta.dirname, "src") },
    },
    server: { port: 5173, strictPort: true },
    preview: { port: 4173, strictPort: true },
    build: {
      sourcemap: true,
      rolldownOptions: {
        output: {
          // Framework code changes rarely: separate chunks stay cached across deploys.
          codeSplitting: {
            groups: [
              { name: "react", test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
              { name: "router", test: /node_modules[\\/]react-router[\\/]/ },
              { name: "query", test: /node_modules[\\/]@tanstack[\\/]/ },
            ],
          },
        },
      },
    },
  };
});
