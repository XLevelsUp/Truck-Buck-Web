// For framework-agnostic packages (types, utils, api-client). Runs in browser
// and Node, so only universal globals are assumed.
import { defineConfig } from "eslint/config";
import globals from "globals";

import { base } from "./base.js";

export const library = defineConfig(
  base,
  {
    languageOptions: {
      globals: { ...globals["shared-node-browser"] },
    },
    rules: {
      // Libraries expose named exports only: greppable and refactor-safe.
      "no-restricted-syntax": [
        "error",
        {
          selector: "ExportDefaultDeclaration",
          message: "Use named exports in shared packages.",
        },
      ],
    },
  },
  {
    // Tool config files (vitest, eslint…) must default-export.
    files: ["*.config.{ts,js,mjs}"],
    rules: { "no-restricted-syntax": "off" },
  },
);

export default library;
