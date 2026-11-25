/**
 * Turnstile `action` per protected surface. The browser renders the widget
 * with it and the server rejects a token whose siteverify `action` differs,
 * so a token solved on one form can't be replayed against another.
 * Cloudflare: 1–32 chars of [A-Za-z0-9_-].
 */
export const turnstileActions = [
  "estimate",
  "quote_lead",
  "business_account",
  "driver_waitlist",
  "transporter_apply",
  "contact",
  "grievance",
] as const;

export type TurnstileAction = (typeof turnstileActions)[number];
