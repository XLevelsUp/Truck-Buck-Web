// Base config: every workspace extends this (directly or via library/react/next).
import js from "@eslint/js";
import comments from "@eslint-community/eslint-plugin-eslint-comments/configs";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier/flat";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import turbo from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";

export const base = defineConfig(
  globalIgnores([
    "**/node_modules/",
    "**/dist/",
    "**/.next/",
    "**/.turbo/",
    "**/coverage/",
    "**/playwright-report/",
    "**/test-results/",
    "**/next-env.d.ts",
  ]),
  {
    linterOptions: { reportUnusedDisableDirectives: "error" },
  },
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        // Type-aware linting: finds the nearest tsconfig for each file.
        projectService: true,
      },
    },
  },
  comments.recommended,
  turbo.configs["flat/recommended"],
  {
    plugins: { "simple-import-sort": simpleImportSort },
    rules: {
      // `any` is banned; an explicit, explained disable is the escape hatch:
      //   // eslint-disable-next-line @typescript-eslint/no-explicit-any -- <why>
      "@typescript-eslint/no-explicit-any": "error",
      "@eslint-community/eslint-comments/require-description": ["error", { ignore: [] }],
      "@eslint-community/eslint-comments/disable-enable-pair": ["error", { allowWholeFile: true }],

      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "smart"],

      // Import ordering: side effects, node builtins, packages, @truckbuck/*,
      // app alias (@/), then relative — autofixable.
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            ["^\\u0000"],
            ["^node:"],
            ["^react$", "^react-dom", "^next", "^@?\\w"],
            ["^@truckbuck/"],
            ["^@/"],
            ["^\\.\\.", "^\\."],
          ],
        },
      ],
      "simple-import-sort/exports": "error",
    },
  },
  {
    // Plain JS config files are not part of any tsconfig; lint them untyped.
    files: ["**/*.{js,mjs,cjs}"],
    extends: [tseslint.configs.disableTypeChecked],
  },
  prettier,
);

export default base;
