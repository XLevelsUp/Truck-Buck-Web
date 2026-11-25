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
  SUPABASE_PUBLISHABLE_KEY: optional,
  SUPABASE_SITE_SECRET: optional,
  GOOGLE_MAPS_API_KEY: optional,
  TURNSTILE_SECRET_KEY: optional,
  /** Comma-separated hostnames a Turnstile token may come from (default: the site's own). */
  TURNSTILE_HOSTNAMES: optional,
  RATE_LIMIT_SALT: optional,
  WHATSAPP_CLOUD_TOKEN: optional,
  WHATSAPP_PHONE_NUMBER_ID: optional,
  WHATSAPP_TRANSPORTER_TEMPLATE: optional,
  /** Template for customer acknowledgements: {{1}} reference, {{2}} callback window. */
  WHATSAPP_ACK_TEMPLATE: optional,
  /** Template for ops alerts: {{1}} lead type, {{2}} reference, {{3}} name, {{4}} phone, {{5}} summary. */
  WHATSAPP_OPS_TEMPLATE: optional,
  /** Ops numbers for new-lead alerts, comma-separated, +91… */
  WHATSAPP_OPS_NUMBERS: z
    .string()
    .regex(/^(\+91[6-9]\d{9})(,\s*\+91[6-9]\d{9})*$/)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  /** Resend (email): API key, sender, ops alert inbox(es) and weekly summary recipients. */
  RESEND_API_KEY: optional,
  EMAIL_FROM: optional,
  OPS_EMAILS: optional,
  SUMMARY_EMAILS: optional,
  /** Google Sheet lead log: Apps Script web-app URL + shared secret (docs/integrations/lead-sheet.gs). */
  SHEET_WEBHOOK_URL: z
    .url()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  SHEET_WEBHOOK_SECRET: optional,
  /** GA4 Measurement Protocol for server-side conversions (G-XXXX + API secret). */
  GA4_MEASUREMENT_ID: z
    .string()
    .regex(/^G-[A-Z0-9]+$/)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  GA4_API_SECRET: optional,
  /** Vercel Cron bearer secret for /api/cron/*. */
  CRON_SECRET: optional,
  /** "true" lets is_sample rows (sample rates, trucks, cities) be used. */
  ALLOW_SAMPLE_DATA: z.enum(["true", "false"]).optional(),
  /** Sentry DSN (server errors). Read directly by src/instrumentation.ts. */
  SENTRY_DSN: z
    .url()
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

const parsed = schema.safeParse({
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SITE_SECRET: process.env.SUPABASE_SITE_SECRET,
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
  TURNSTILE_HOSTNAMES: process.env.TURNSTILE_HOSTNAMES,
  RATE_LIMIT_SALT: process.env.RATE_LIMIT_SALT,
  WHATSAPP_CLOUD_TOKEN: process.env.WHATSAPP_CLOUD_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
  WHATSAPP_TRANSPORTER_TEMPLATE: process.env.WHATSAPP_TRANSPORTER_TEMPLATE,
  WHATSAPP_ACK_TEMPLATE: process.env.WHATSAPP_ACK_TEMPLATE,
  WHATSAPP_OPS_TEMPLATE: process.env.WHATSAPP_OPS_TEMPLATE,
  WHATSAPP_OPS_NUMBERS: process.env.WHATSAPP_OPS_NUMBERS,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  OPS_EMAILS: process.env.OPS_EMAILS,
  SUMMARY_EMAILS: process.env.SUMMARY_EMAILS,
  SHEET_WEBHOOK_URL: process.env.SHEET_WEBHOOK_URL,
  SHEET_WEBHOOK_SECRET: process.env.SHEET_WEBHOOK_SECRET,
  GA4_MEASUREMENT_ID: process.env.GA4_MEASUREMENT_ID,
  GA4_API_SECRET: process.env.GA4_API_SECRET,
  CRON_SECRET: process.env.CRON_SECRET,
  ALLOW_SAMPLE_DATA: process.env.ALLOW_SAMPLE_DATA || undefined,
  SENTRY_DSN: process.env.SENTRY_DSN,
});

if (!parsed.success) {
  throw new Error(`❌ Invalid server environment:\n${z.prettifyError(parsed.error)}`);
}

const raw = parsed.data;

/**
 * The site connects with the publishable key only. A secret / service-role
 * key bypasses RLS, so it must never be configured here (or reach a browser).
 */
const looksPrivileged = (key: string) => {
  if (key.startsWith("sb_secret_")) return true;
  const payload = key.split(".")[1];
  if (!payload) return false;
  try {
    return (
      (JSON.parse(Buffer.from(payload, "base64url").toString()) as { role?: string }).role ===
      "service_role"
    );
  } catch {
    return false;
  }
};
if (raw.SUPABASE_PUBLISHABLE_KEY && looksPrivileged(raw.SUPABASE_PUBLISHABLE_KEY)) {
  throw new Error(
    "❌ SUPABASE_PUBLISHABLE_KEY is a secret/service-role key. Use the publishable key.",
  );
}
if (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "❌ SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY must not be set for the marketing site. " +
      "It uses SUPABASE_PUBLISHABLE_KEY + SUPABASE_SITE_SECRET (see SECURITY.md).",
  );
}
if (raw.SUPABASE_SITE_SECRET && raw.SUPABASE_SITE_SECRET.length < 32) {
  throw new Error("❌ SUPABASE_SITE_SECRET must be at least 32 characters.");
}
const isProductionDeploy = process.env.VERCEL_ENV === "production";

if (
  isProductionDeploy &&
  (!raw.TURNSTILE_SECRET_KEY || !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
) {
  throw new Error(
    "❌ TURNSTILE_SECRET_KEY and NEXT_PUBLIC_TURNSTILE_SITE_KEY must be set for production deploys.",
  );
}

/** Cloudflare's documented test secrets (always pass / always fail / token spent). */
const TEST_TURNSTILE_SECRET = /^[123]x0{30,}AA$/;

/**
 * Hostnames a real Turnstile token must report: TURNSTILE_HOSTNAMES if set,
 * otherwise the canonical site host (+ www) and this Vercel deployment's URLs.
 */
function turnstileHostnames(): string[] {
  if (raw.TURNSTILE_HOSTNAMES) {
    return raw.TURNSTILE_HOSTNAMES.split(",")
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean);
  }
  const hosts = new Set<string>();
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site) {
    const host = new URL(site).hostname.toLowerCase();
    hosts.add(host);
    hosts.add(host.startsWith("www.") ? host.slice(4) : `www.${host}`);
  }
  for (const url of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]) {
    if (url) hosts.add(url.toLowerCase());
  }
  return [...hosts];
}

/** "a, b ,c" → ["a","b","c"]. */
function list(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export const serverEnv = {
  supabase:
    raw.SUPABASE_URL && raw.SUPABASE_PUBLISHABLE_KEY && raw.SUPABASE_SITE_SECRET
      ? {
          url: raw.SUPABASE_URL,
          publishableKey: raw.SUPABASE_PUBLISHABLE_KEY,
          siteSecret: raw.SUPABASE_SITE_SECRET,
        }
      : null,
  googleMapsApiKey: raw.GOOGLE_MAPS_API_KEY ?? null,
  // Cloudflare's documented always-pass test secret, outside production only.
  turnstileSecretKey:
    raw.TURNSTILE_SECRET_KEY ?? (isProductionDeploy ? null : "1x0000000000000000000000000000000AA"),
  /**
   * Hostname allowlist for siteverify. Null with a test secret: Cloudflare's
   * test responses report a dummy hostname (example.com) and no action.
   */
  turnstileHostnames:
    raw.TURNSTILE_SECRET_KEY && !TEST_TURNSTILE_SECRET.test(raw.TURNSTILE_SECRET_KEY)
      ? turnstileHostnames()
      : null,
  rateLimitSalt: raw.RATE_LIMIT_SALT ?? "truckbuck-dev-salt",
  /**
   * WhatsApp Cloud API (Meta). Token + phone number id enable sending; each
   * template is optional (unset = that message is skipped and logged).
   */
  whatsappCloud:
    raw.WHATSAPP_CLOUD_TOKEN && raw.WHATSAPP_PHONE_NUMBER_ID
      ? {
          token: raw.WHATSAPP_CLOUD_TOKEN,
          phoneNumberId: raw.WHATSAPP_PHONE_NUMBER_ID,
          transporterTemplate: raw.WHATSAPP_TRANSPORTER_TEMPLATE ?? null,
          ackTemplate: raw.WHATSAPP_ACK_TEMPLATE ?? null,
          opsTemplate: raw.WHATSAPP_OPS_TEMPLATE ?? null,
        }
      : null,
  whatsappOpsNumbers: list(raw.WHATSAPP_OPS_NUMBERS),
  /** Resend; null = emails skipped (logged). */
  email:
    raw.RESEND_API_KEY && raw.EMAIL_FROM
      ? { apiKey: raw.RESEND_API_KEY, from: raw.EMAIL_FROM }
      : null,
  opsEmails: list(raw.OPS_EMAILS),
  summaryEmails: list(raw.SUMMARY_EMAILS),
  sheet:
    raw.SHEET_WEBHOOK_URL && raw.SHEET_WEBHOOK_SECRET
      ? { url: raw.SHEET_WEBHOOK_URL, secret: raw.SHEET_WEBHOOK_SECRET }
      : null,
  ga4:
    raw.GA4_MEASUREMENT_ID && raw.GA4_API_SECRET
      ? { measurementId: raw.GA4_MEASUREMENT_ID, apiSecret: raw.GA4_API_SECRET }
      : null,
  cronSecret: raw.CRON_SECRET ?? null,
  /**
   * Sample data is never used by a production build unless explicitly enabled.
   * Dev servers allow it by default; set ALLOW_SAMPLE_DATA=true for previews.
   */
  allowSampleData:
    raw.ALLOW_SAMPLE_DATA === undefined
      ? process.env.NODE_ENV !== "production"
      : raw.ALLOW_SAMPLE_DATA === "true",
} as const;
