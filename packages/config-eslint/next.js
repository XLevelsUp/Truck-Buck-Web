// For Next.js apps. eslint-config-next brings react, react-hooks, jsx-a11y,
// import and @next/next rules (Core Web Vitals set).
import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import globals from "globals";

import { base } from "./base.js";

// nextVitals goes first so base's typescript-eslint parser (needed for typed
// rules) wins over eslint-config-next's own parser.
export const next = defineConfig(nextVitals, base, {
  languageOptions: {
    globals: { ...globals.browser, ...globals.node },
  },
  rules: {
    // Ordering is handled by simple-import-sort in base.
    "import/order": "off",
  },
});

export default next;
