// Copies each app's .env.example to .env.local if .env.local does not exist.
// Never overwrites: local values are yours.
import { copyFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const appsDir = join(import.meta.dirname, "..", "apps");

for (const app of readdirSync(appsDir)) {
  const example = join(appsDir, app, ".env.example");
  const local = join(appsDir, app, ".env.local");
  if (!existsSync(example)) continue;
  if (existsSync(local)) {
    console.log(`apps/${app}/.env.local exists, leaving it alone`);
    continue;
  }
  copyFileSync(example, local);
  console.log(`apps/${app}/.env.local created from .env.example`);
}
