/** @type {import("@commitlint/types").UserConfig} */
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Scopes are optional, but when present must name a workspace or area.
    "scope-enum": [
      2,
      "always",
      [
        "marketing",
        "admin",
        "ui",
        "types",
        "api-client",
        "utils",
        "config-typescript",
        "config-eslint",
        "ci",
        "deps",
        "docs",
        "repo",
      ],
    ],
  },
};

export default config;
