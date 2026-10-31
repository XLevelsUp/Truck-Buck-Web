// Runs the production `output: "standalone"` server exactly as the Docker
// image does: copy static assets next to server.js, then start it.
// (`next start` does not support standalone output.)
import { spawn } from "node:child_process";
import { cpSync, existsSync } from "node:fs";
import { join } from "node:path";

const appDir = join(import.meta.dirname, "..");
const standaloneApp = join(appDir, ".next/standalone/apps/marketing");
const server = join(standaloneApp, "server.js");

if (!existsSync(server)) {
  console.error("No standalone build found. Run `pnpm build` first.");
  process.exit(1);
}

cpSync(join(appDir, ".next/static"), join(standaloneApp, ".next/static"), { recursive: true });
cpSync(join(appDir, "public"), join(standaloneApp, "public"), { recursive: true });

const child = spawn(process.execPath, [server], {
  stdio: "inherit",
  env: { ...process.env, PORT: process.env.PORT ?? "3000", HOSTNAME: "0.0.0.0" },
});
child.on("exit", (code) => process.exit(code ?? 0));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
