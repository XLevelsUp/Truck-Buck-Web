/**
 * Writes src/styles/tokens.css from src/tokens/tokens.ts.
 *   pnpm --filter @truckbuck/ui tokens
 * Runs on plain Node (type stripping), no build step.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { buildTokensCss } from "../src/tokens/css.ts";

const target = join(import.meta.dirname, "../src/styles/tokens.css");
writeFileSync(target, buildTokensCss());
console.warn(`Wrote ${target}`);
