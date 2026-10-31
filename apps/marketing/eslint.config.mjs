import { defineConfig } from "eslint/config";

import { next } from "@truckbuck/config-eslint/next";

export default defineConfig(next, {
  languageOptions: { parserOptions: { tsconfigRootDir: import.meta.dirname } },
});
