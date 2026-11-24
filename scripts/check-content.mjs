/**
 * Content gate: no lorem ipsum, no stray placeholders, and every TODO points
 * at an item on the NEEDS-FROM-CLIENT checklist (docs/blueprint.md §11).
 *
 * Rules, per line of shipped source (apps/marketing/src, packages/<pkg>/src, supabase):
 *   - "lorem"          always fails.
 *   - "TODO"           must name an NFC id (e.g. TODO(NFC-11)) that exists in the checklist.
 *   - "placeholder"    only as the form-field hint attribute (placeholder=, placeholder:,
 *                      fooPlaceholder, ::placeholder, placeholder-*); anywhere else it fails.
 * Any "NFC-n" mentioned must also exist in the checklist.
 *
 * Run: node scripts/check-content.mjs
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const EXTENSIONS = /\.(ts|tsx|mts|mjs|js|css|sql|json|md)$/;
const SKIP_DIRS = new Set(["node_modules", ".next", ".turbo", "dist", "coverage"]);

const blueprint = readFileSync(join(root, "docs/blueprint.md"), "utf8");
const checklist = blueprint.slice(blueprint.indexOf("## 11. NEEDS-FROM-CLIENT"));
const known = new Set([...checklist.matchAll(/\*\*(NFC-\d+) —/g)].map((m) => m[1]));
if (known.size === 0) {
  console.error("Could not read the NEEDS-FROM-CLIENT checklist from docs/blueprint.md.");
  process.exit(1);
}

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (EXTENSIONS.test(name)) out.push(path);
  }
  return out;
}

const roots = [join(root, "supabase"), join(root, "apps/marketing/src")];
for (const name of readdirSync(join(root, "packages")))
  roots.push(join(root, "packages", name, "src"));
const files = roots.flatMap((dir) => walk(dir));
// This script and its own docs mention the words on purpose.
const self = new Set([join(root, "scripts/check-content.mjs")]);

/** The form-field hint: an attribute, prop, key or CSS selector — not placeholder content. */
const PLACEHOLDER_ATTRIBUTE =
  /\bplaceholder\??\s*[=:,})]|\bplaceholder\b(?=\s*$)|::placeholder|\bplaceholder-|[a-z]Placeholder\b|\bPlaceholder[A-Z]|getByPlaceholder|"placeholder"|\{placeholder\}/g;

const problems = [];
const usage = new Map();

for (const file of files) {
  if (self.has(file)) continue;
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    const where = `${relative(root, file).replaceAll("\\", "/")}:${index + 1}`;
    const ids = [...line.matchAll(/NFC-(\d+)/g)].map((m) => `NFC-${m[1]}`);
    for (const id of ids) {
      if (!known.has(id)) problems.push(`${where}  ${id} is not on the NEEDS-FROM-CLIENT list`);
      usage.set(id, (usage.get(id) ?? 0) + 1);
    }
    if (/lorem/i.test(line)) problems.push(`${where}  lorem ipsum`);
    if (/todo/i.test(line) && ids.length === 0) problems.push(`${where}  TODO without an NFC id`);
    if (/placeholder/i.test(line.replace(PLACEHOLDER_ATTRIBUTE, ""))) {
      problems.push(
        `${where}  "placeholder" used for content (say "sample", or name the NFC item)`,
      );
    }
  });
}

if (problems.length > 0) {
  console.error(`Content check failed (${problems.length}):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

const summary = [...usage.entries()]
  .sort((a, b) => Number(a[0].slice(4)) - Number(b[0].slice(4)))
  .map(([id, count]) => `${id}×${count}`)
  .join(" ");
console.log(
  `Content check passed: ${files.length} files. Open client items referenced: ${summary}`,
);
