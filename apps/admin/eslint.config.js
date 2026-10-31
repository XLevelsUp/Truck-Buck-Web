import { defineConfig } from "eslint/config";
import globals from "globals";

import { react } from "@truckbuck/config-eslint/react";

export default defineConfig(
  react,
  {
    languageOptions: { parserOptions: { tsconfigRootDir: import.meta.dirname } },
  },
  {
    files: ["**/*.tsx"],
    rules: {
      // Context modules export their Provider and hook together by convention.
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true, allowExportNames: ["useAuth", "useTenant", "useApiClient"] },
      ],
    },
  },
  {
    files: ["*.config.ts", "e2e/**"],
    languageOptions: { globals: { ...globals.node } },
  },
);
