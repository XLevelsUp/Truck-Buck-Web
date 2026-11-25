/**
 * PII redaction for logs and error reports (server logs, Sentry). Removes
 * values of known personal fields and masks phone numbers and email
 * addresses wherever they appear in free text.
 */

const PII_KEYS = new Set([
  "name",
  "phone",
  "phone_e164",
  "phonee164",
  "email",
  "company",
  "address",
  "pickup",
  "drop",
  "details",
  "message",
  "ip",
  "x-forwarded-for",
  "x-real-ip",
  "cookie",
  "authorization",
  "turnstiletoken",
  "cf-turnstile-response",
  "website",
]);

const PHONE = /(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b/g;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const IPV4 = /\b\d{1,3}(?:\.\d{1,3}){3}\b/g;

/** Masks phone numbers, email addresses and IPv4 addresses in a string. */
export function redactText(text: string): string {
  return text.replace(EMAIL, "[email]").replace(PHONE, "[phone]").replace(IPV4, "[ip]");
}

/** Deep copy with personal fields replaced by "[redacted]" and free text masked. */
export function redact<T>(value: T, depth = 0): T {
  if (depth > 6) return "[…]" as T;
  if (typeof value === "string") return redactText(value) as T;
  if (Array.isArray(value)) return (value as unknown[]).map((item) => redact(item, depth + 1)) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      out[key] = PII_KEYS.has(key.toLowerCase().replace(/[^a-z_-]/g, ""))
        ? "[redacted]"
        : redact(item, depth + 1);
    }
    return out as T;
  }
  return value;
}
