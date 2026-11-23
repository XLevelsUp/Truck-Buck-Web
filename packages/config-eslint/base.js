// Base config: every workspace extends this (directly or via library/react/next).
import js from "@eslint/js";
import comments from "@eslint-community/eslint-plugin-eslint-comments/configs";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier/flat";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import turbo from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";

// `#abc`, `#abcd`, `#aabbcc`, `#aabbccdd` not followed by more word characters
// (so `#main` or `#get-price` anchors don't match), and CSS colour functions.
const RAW_COLOR =
  "/(^|[^\\w&])#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\\w-])|\\b(rgba?|hsla?|hwb|oklab|oklch|lab|lch)\\(/";
const rawColorSelectors = [
  `Literal[value=${RAW_COLOR}]`,
  `TemplateElement[value.raw=${RAW_COLOR}]`,
  `JSXText[value=${RAW_COLOR}]`,
];

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
    // Design tokens are the only source of colour. A raw hex or rgb()/oklch()
    // value in code bypasses theming and contrast checks. Exempt: the token
    // source itself (packages/ui/src/tokens/), via the override below.
    rules: {
      "no-restricted-syntax": [
        "error",
        ...rawColorSelectors.map((selector) => ({
          selector,
          message:
            "Raw colour value. Use a design token: a Tailwind class (bg-primary), var(--tb-<role>), or `themes` from @truckbuck/ui/tokens. Add new colours to packages/ui/src/tokens/tokens.ts.",
        })),
      ],
    },
  },
  {
    files: ["**/src/tokens/**"],
    rules: { "no-restricted-syntax": "off" },
  },
  {
    // Plain JS config files are not part of any tsconfig; lint them untyped.
    files: ["**/*.{js,mjs,cjs}"],
    extends: [tseslint.configs.disableTypeChecked],
  },
  prettier,
);

export default base;
