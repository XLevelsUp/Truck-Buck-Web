// zod/mini: this schema ships in the entry chunk (runtime check in src/env.ts),
// so use the tree-shakable build. Messages are explicit because mini has no
// localised defaults.
import * as z from "zod/mini";

const APP_ENVS = ["development", "test", "staging", "production"] as const;

function message(expected: string) {
  return (issue: { input?: unknown }) =>
    issue.input === undefined || issue.input === ""
      ? "Required, but not set"
      : `${expected} (got ${JSON.stringify(issue.input)})`;
}

/**
 * Admin env schema. Shared by vite.config.ts (validates at dev/build start)
 * and src/env.ts (validates at runtime in the browser).
 * VITE_* values are public: they are inlined into the bundle.
 */
export const envSchema = z.object({
  VITE_API_BASE_URL: z.url({ protocol: /^https?$/, error: message("Must be an http(s) URL") }),
  VITE_APP_ENV: z.enum(APP_ENVS, { error: message(`Must be one of ${APP_ENVS.join(" | ")}`) }),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(
      [
        "",
        "❌ Invalid environment variables for @truckbuck/admin:",
        z.prettifyError(parsed.error),
        "",
        "Copy apps/admin/.env.example to apps/admin/.env.local (or run `pnpm setup:env`).",
        "",
      ].join("\n"),
    );
  }
  return parsed.data;
}
