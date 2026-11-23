#!/usr/bin/env node
/**
 * Fails if a stylesheet contains a raw colour. Colours belong in
 * packages/ui/src/tokens/tokens.ts; CSS uses var(--tb-*) or Tailwind token
 * classes. TS/TSX/JS are covered by the ESLint rule in
 * packages/config-eslint/base.js — this script covers CSS, which ESLint
 * doesn't read.
 *
 *   pnpm lint:colors
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

// Generated from tokens.ts — the one place raw values are allowed.
const ALLOWED = new Set(["packages/ui/src/styles/tokens.css"]);

const HEX = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b/gi;
const COLOR_FN = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/gi;
// Named colours other than the keywords that carry no brand meaning.
const NAMED = /:\s*[^;{}]*\b(?:white|black|red|blue|green|yellow|orange|gray|grey)\b/gi;

const files = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "*.css"],
  {
    encoding: "utf8",
  },
)
  .split("\n")
  .filter((file) => file && !ALLOWED.has(file) && !file.includes("/coverage/"));

const problems = [];
for (const file of files) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, index) => {
    const code = line.replace(/\/\*.*?\*\//g, "");
    for (const pattern of [HEX, COLOR_FN, NAMED]) {
      for (const match of code.matchAll(pattern)) {
        problems.push(`${file}:${index + 1}  raw colour "${match[0].trim()}"`);
      }
    }
  });
}

if (problems.length > 0) {
  console.error(problems.join("\n"));
  console.error(
    `\n${problems.length} raw colour(s). Add a role to packages/ui/src/tokens/tokens.ts and use var(--tb-<role>).`,
  );
  process.exit(1);
}
console.warn(`lint:colors — ${files.length} stylesheet(s) clean.`);
