import { z } from "zod";

/**
 * Validated environment for the marketing site.
 *
 * Imported by next.config.ts, so `next build` / `next dev` fail fast with a
 * readable message when a variable is missing or malformed.
 *
 * Everything here is PUBLIC (NEXT_PUBLIC_*): it is inlined into the client
 * bundle at build time. Server-only secrets must go in a separate
 * `env.server.ts` that starts with `import "server-only"`, so importing it
 * from a Client Component fails the build instead of leaking the value.
 */
function message(expected: string) {
  return (issue: { input?: unknown }) =>
    issue.input === undefined || issue.input === ""
      ? "Required, but not set"
      : `${expected} (got ${JSON.stringify(issue.input)})`;
}

const schema = z.object({
  NEXT_PUBLIC_SITE_URL: z
    .url({ protocol: /^https?$/, error: message("Must be an http(s) URL") })
    .transform((url) => url.replace(/\/+$/, "")),
  NEXT_PUBLIC_PLAY_STORE_URL: z
    .url({ protocol: /^https$/, error: message("Must be an https URL") })
    .refine((url) => url.startsWith("https://play.google.com/"), {
      message: "Must be a https://play.google.com/ listing URL",
    }),
});

// Each variable is referenced literally so Next.js can inline it.
const parsed = schema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_PLAY_STORE_URL: process.env.NEXT_PUBLIC_PLAY_STORE_URL,
});

if (!parsed.success) {
  throw new Error(
    [
      "",
      "❌ Invalid environment variables for @truckbuck/marketing:",
      z.prettifyError(parsed.error),
      "",
      "Copy apps/marketing/.env.example to apps/marketing/.env.local (or run `pnpm setup:env`).",
      "",
    ].join("\n"),
  );
}

export const env = parsed.data;
