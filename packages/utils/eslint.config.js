import { defineConfig } from "eslint/config";

import { library } from "@truckbuck/config-eslint/library";

export default defineConfig(library, {
  languageOptions: { parserOptions: { tsconfigRootDir: import.meta.dirname } },
});
