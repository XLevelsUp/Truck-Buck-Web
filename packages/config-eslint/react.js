// For React code that is not Next.js: packages/ui and Vite apps.
import { defineConfig } from "eslint/config";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

import { base } from "./base.js";

export const react = defineConfig(
  base,
  {
    languageOptions: {
      globals: { ...globals.browser },
    },
    rules: {
      // Vite's built-in import.meta.env flags are compile-time constants, not
      // deploy-time env vars, so they don't belong in turbo.json hashing.
      "turbo/no-undeclared-env-vars": [
        "error",
        { allowList: ["^DEV$", "^PROD$", "^MODE$", "^SSR$", "^BASE_URL$"] },
      ],
    },
  },
  reactHooks.configs.flat["recommended-latest"],
  jsxA11y.flatConfigs.recommended,
  {
    files: ["**/*.tsx"],
    plugins: { "react-refresh": reactRefresh },
    rules: {
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
);

export default react;
