// Removes build artefacts and caches in every workspace, then node_modules.
// Cross-platform replacement for `rm -rf` so it works the same on Windows.
import { readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const artefacts = [
  ".next",
  "dist",
  "coverage",
  ".turbo",
  "playwright-report",
  "test-results",
  "tsconfig.tsbuildinfo",
  "node_modules",
];

const workspaces = ["apps", "packages"].flatMap((dir) =>
  readdirSync(join(root, dir), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(root, dir, entry.name)),
);

for (const dir of [...workspaces, root]) {
  for (const name of artefacts) {
    rmSync(join(dir, name), { recursive: true, force: true });
  }
}

console.log(`Cleaned ${workspaces.length} workspaces and the repo root.`);
