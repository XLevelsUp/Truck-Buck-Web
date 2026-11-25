/**
 * Security headers for every response.
 *
 * CSP is a STARTER policy. App Router pages inline small bootstrap scripts,
 * so static pages need `'unsafe-inline'` for scripts unless we either:
 *   - switch to per-request nonces via proxy.ts (forces dynamic rendering —
 *     costs performance on a marketing site), or
 *   - adopt hash-based CSP via `experimental.sri` once it is stable.
 *
 * With a GTM container configured (NEXT_PUBLIC_GTM_ID), the hosts Google
 * documents for GTM + GA4, and Microsoft Clarity (session replay, added as a
 * GTM tag), are allowed. GTM itself loads only after analytics consent.
 */
const ANALYTICS = {
  script: ["https://www.googletagmanager.com", "https://*.clarity.ms"],
  img: [
    "https://www.googletagmanager.com",
    "https://*.google-analytics.com",
    "https://*.googletagmanager.com",
    "https://*.clarity.ms",
    "https://c.bing.com",
  ],
  connect: [
    "https://*.google-analytics.com",
    "https://*.analytics.google.com",
    "https://*.googletagmanager.com",
    "https://*.clarity.ms",
    "https://c.bing.com",
  ],
  frame: ["https://www.googletagmanager.com"],
};

export function securityHeaders({ isDev, gtm = false }: { isDev: boolean; gtm?: boolean }) {
  const extra = (list: string[]) => (gtm ? ` ${list.join(" ")}` : "");
  const csp = [
    "default-src 'self'",
    // Cloudflare Turnstile (lead forms only, loaded on demand).
    `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com${extra(ANALYTICS.script)}${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob:${extra(ANALYTICS.img)}`,
    "font-src 'self'",
    // All Maps traffic goes through our own /api routes.
    `connect-src 'self'${extra(ANALYTICS.connect)}${isDev ? " ws:" : ""}`,
    // Turnstile challenge + the tap-to-open Google Maps embed (+ GTM preview).
    `frame-src https://challenges.cloudflare.com https://www.google.com${extra(ANALYTICS.frame)}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  return [
    { key: "Content-Security-Policy", value: csp },
    // 2 years. Add `; preload` only after submitting the domain to hstspreload.org.
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(self), payment=()",
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ];
}
