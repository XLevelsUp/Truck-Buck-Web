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
  /** WhatsApp Business number, digits only with country code (919876543210). Unset hides WhatsApp CTAs. */
  NEXT_PUBLIC_WHATSAPP_NUMBER: z
    .string()
    .regex(/^91[6-9]\d{9}$/, { error: message("Must be 91 followed by a 10-digit mobile number") })
    .optional(),
  /** Cloudflare Turnstile site key. Dev falls back to Cloudflare's always-pass test key. */
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1).optional(),
  /** Referrer-restricted Maps Embed API key for the tap-to-open interactive map. Unset = link out to Google Maps. */
  NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY: z.string().min(1).optional(),
  /** Google Search Console "HTML tag" token (the content value only). Unset = no tag. */
  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: z
    .string()
    .regex(/^[\w-]+$/)
    .optional(),
  /** Bing Webmaster Tools msvalidate.01 token. Unset = no tag. */
  NEXT_PUBLIC_BING_SITE_VERIFICATION: z
    .string()
    .regex(/^[\w-]+$/)
    .optional(),
  /** Google Tag Manager container (GA4 etc.). Loaded only after analytics consent. Unset = no GTM. */
  NEXT_PUBLIC_GTM_ID: z
    .string()
    .regex(/^GTM-[A-Z0-9]+$/)
    .optional(),
  /** Comma-separated experiment keys to run (see src/lib/experiments.ts). Unset = all run control. */
  NEXT_PUBLIC_EXPERIMENTS: z
    .string()
    .regex(/^[a-z_,]*$/)
    .optional(),
});

/**
 * On Vercel, NEXT_PUBLIC_SITE_URL may be left unset: production falls back to
 * the project's production domain, previews to their own branch/deployment
 * URL (so a preview never claims production as its canonical origin).
 * Only server code reads `env`, where the VERCEL_* system variables exist.
 */
function vercelSiteUrl(): string | undefined {
  const host =
    process.env.VERCEL_ENV === "production"
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL
      : (process.env.VERCEL_BRANCH_URL ?? process.env.VERCEL_URL);
  return host ? `https://${host}` : undefined;
}

// Each variable is referenced literally so Next.js can inline it.
const parsed = schema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || vercelSiteUrl(),
  NEXT_PUBLIC_PLAY_STORE_URL: process.env.NEXT_PUBLIC_PLAY_STORE_URL,
  NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || undefined,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY:
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
    // Cloudflare's documented always-pass test key, outside production only.
    (process.env.VERCEL_ENV === "production" ? undefined : "1x00000000000000000000AA"),
  NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY || undefined,
  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION:
    process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  NEXT_PUBLIC_BING_SITE_VERIFICATION: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || undefined,
  NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID || undefined,
  NEXT_PUBLIC_EXPERIMENTS: process.env.NEXT_PUBLIC_EXPERIMENTS || undefined,
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
