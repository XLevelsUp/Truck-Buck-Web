import "server-only";

import { z } from "zod";

/**
 * Server-only secrets and switches. `import "server-only"` makes the build
 * fail if a Client Component ever imports this file.
 *
 * Everything is optional so the site builds without third-party accounts;
 * each integration degrades as documented in .env.example. Production on
 * Vercel refuses to start without the bot check configured.
 */
const optional = z
  .string()
  .optional()
  .transform((value) => (value ? value : undefined));

const schema = z.object({
  SUPABASE_URL: z
    .url()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  SUPABASE_SECRET_KEY: optional,
  GOOGLE_MAPS_API_KEY: optional,
  TURNSTILE_SECRET_KEY: optional,
  RATE_LIMIT_SALT: optional,
  WHATSAPP_CLOUD_TOKEN: optional,
  WHATSAPP_PHONE_NUMBER_ID: optional,
  WHATSAPP_TRANSPORTER_TEMPLATE: optional,
  /** "true" lets is_sample rows (sample rates, trucks, cities) be used. */
  ALLOW_SAMPLE_DATA: z.enum(["true", "false"]).optional(),
});

const parsed = schema.safeParse({
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
  RATE_LIMIT_SALT: process.env.RATE_LIMIT_SALT,
  WHATSAPP_CLOUD_TOKEN: process.env.WHATSAPP_CLOUD_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
  WHATSAPP_TRANSPORTER_TEMPLATE: process.env.WHATSAPP_TRANSPORTER_TEMPLATE,
  ALLOW_SAMPLE_DATA: process.env.ALLOW_SAMPLE_DATA || undefined,
});

if (!parsed.success) {
  throw new Error(`❌ Invalid server environment:\n${z.prettifyError(parsed.error)}`);
}

const raw = parsed.data;
const isProductionDeploy = process.env.VERCEL_ENV === "production";

if (
  isProductionDeploy &&
  (!raw.TURNSTILE_SECRET_KEY || !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
) {
  throw new Error(
    "❌ TURNSTILE_SECRET_KEY and NEXT_PUBLIC_TURNSTILE_SITE_KEY must be set for production deploys.",
  );
}

export const serverEnv = {
  supabase:
    raw.SUPABASE_URL && raw.SUPABASE_SECRET_KEY
      ? { url: raw.SUPABASE_URL, secretKey: raw.SUPABASE_SECRET_KEY }
      : null,
  googleMapsApiKey: raw.GOOGLE_MAPS_API_KEY ?? null,
  // Cloudflare's documented always-pass test secret, outside production only.
  turnstileSecretKey:
    raw.TURNSTILE_SECRET_KEY ?? (isProductionDeploy ? null : "1x0000000000000000000000000000000AA"),
  rateLimitSalt: raw.RATE_LIMIT_SALT ?? "truckbuck-dev-salt",
  /** WhatsApp Cloud API (Meta). All three or nothing; null = acknowledgements are skipped. */
  whatsappCloud:
    raw.WHATSAPP_CLOUD_TOKEN && raw.WHATSAPP_PHONE_NUMBER_ID && raw.WHATSAPP_TRANSPORTER_TEMPLATE
      ? {
          token: raw.WHATSAPP_CLOUD_TOKEN,
          phoneNumberId: raw.WHATSAPP_PHONE_NUMBER_ID,
          transporterTemplate: raw.WHATSAPP_TRANSPORTER_TEMPLATE,
        }
      : null,
  /**
   * Sample data is never used by a production build unless explicitly enabled.
   * Dev servers allow it by default; set ALLOW_SAMPLE_DATA=true for previews.
   */
  allowSampleData:
    raw.ALLOW_SAMPLE_DATA === undefined
      ? process.env.NODE_ENV !== "production"
      : raw.ALLOW_SAMPLE_DATA === "true",
} as const;
