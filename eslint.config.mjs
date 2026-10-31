// Lints root-level scripts and config files only; each workspace has its own config.
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";

import { base } from "@truckbuck/config-eslint/base";

export default defineConfig(globalIgnores(["apps/", "packages/"]), base, {
  languageOptions: { globals: { ...globals.node } },
  rules: {
    // Root scripts are CLIs: printing is their job.
    "no-console": "off",
  },
});
