import { defineConfig } from "eslint/config";

import { react } from "@truckbuck/config-eslint/react";

export default defineConfig(react, {
  languageOptions: { parserOptions: { tsconfigRootDir: import.meta.dirname } },
  rules: {
    // A component library exports variant helpers (buttonVariants) next to
    // components by design; Fast Refresh boundaries are the apps' concern.
    "react-refresh/only-export-components": "off",
  },
});
