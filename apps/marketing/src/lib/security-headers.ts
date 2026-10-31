/**
 * Security headers for every response.
 *
 * CSP is a STARTER policy. App Router pages inline small bootstrap scripts,
 * so static pages need `'unsafe-inline'` for scripts unless we either:
 *   - switch to per-request nonces via proxy.ts (forces dynamic rendering —
 *     costs performance on a marketing site), or
 *   - adopt hash-based CSP via `experimental.sri` once it is stable.
 * Revisit before adding any third-party script (analytics, chat widgets).
 */
export function securityHeaders({ isDev }: { isDev: boolean }) {
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self'${isDev ? " ws:" : ""}`,
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
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ];
}
