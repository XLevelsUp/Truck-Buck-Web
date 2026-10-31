// Architectural import rules for the whole monorepo. Run with `pnpm lint:deps`.
// Turborepo already refuses cycles between *declared* workspace dependencies;
// these rules catch the undeclared or file-level ones that slip past it.

/** @type {import("dependency-cruiser").IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment: "Circular imports break tree-shaking, HMR and initialisation order.",
      from: {},
      to: { circular: true },
    },
    {
      name: "packages-must-not-import-apps",
      severity: "error",
      comment: "Shared packages are consumed by apps, never the other way round.",
      from: { path: "^packages/" },
      to: { path: "^apps/" },
    },
    {
      name: "apps-must-not-import-other-apps",
      severity: "error",
      comment: "Apps are deployed independently. Move shared code to packages/*.",
      from: { path: "^apps/([^/]+)/" },
      to: { path: "^apps/", pathNot: "^apps/$1/" },
    },
    {
      name: "no-relative-imports-across-workspaces",
      severity: "error",
      comment:
        "Import other workspaces by package name (e.g. @truckbuck/ui/button) so their `exports` map is the public API.",
      from: { path: "^(apps|packages)/([^/]+)/" },
      to: {
        path: "^(apps|packages)/",
        pathNot: "^$1/$2/",
        dependencyTypes: ["local"],
      },
    },
    {
      name: "no-undeclared-dependencies",
      severity: "error",
      comment: "Every imported package must be listed in the importing workspace's package.json.",
      from: { path: "^(apps|packages)/" },
      to: { dependencyTypes: ["npm-no-pkg", "npm-unknown"] },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: {
      path: "(^|/)(\\.next|dist|coverage|\\.turbo|playwright-report|test-results)/",
    },
    tsPreCompilationDeps: true,
    combinedDependencies: false,
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      mainFields: ["module", "main", "types"],
      extensions: [".ts", ".tsx", ".js", ".mjs", ".cjs", ".json"],
    },
    reporterOptions: {
      text: { highlightFocused: true },
    },
  },
};
