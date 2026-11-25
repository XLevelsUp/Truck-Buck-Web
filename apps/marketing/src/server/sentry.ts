import "server-only";

import * as Sentry from "@sentry/nextjs";

import { redact, redactText } from "@/lib/redact";

/**
 * Sentry for the server, errors only (no tracing, no replay, no default PII).
 * beforeSend strips request bodies, cookies, headers, query strings and user
 * data, and masks phones/emails/IPs left in messages.
 */
export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.VERCEL_ENV ?? "development",
    tracesSampleRate: 0,
    // Collect nothing personal: no user, cookies, headers, bodies or query strings.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      databaseQueryData: false,
    },
    beforeBreadcrumb: (breadcrumb) =>
      breadcrumb.category === "console" || breadcrumb.category === "http" ? null : breadcrumb,
    beforeSend: scrubEvent,
  });
}

export function scrubEvent<E extends Sentry.ErrorEvent>(event: E): E {
  delete event.user;
  if (event.request) {
    const url = event.request.url?.split("?")[0];
    const method = event.request.method;
    event.request = { ...(method ? { method } : {}), ...(url ? { url } : {}) };
  }
  if (event.message) event.message = redactText(event.message);
  for (const exception of event.exception?.values ?? []) {
    if (exception.value) exception.value = redactText(exception.value);
  }
  if (event.extra) event.extra = redact(event.extra);
  if (event.contexts) event.contexts = redact(event.contexts);
  return event;
}

/** Forwards a browser error report (already validated) to Sentry. */
export function captureClientError(report: { message: string; source: string; path: string }) {
  Sentry.captureMessage(redactText(report.message), {
    level: "error",
    tags: { origin: "browser", path: report.path },
    extra: { source: report.source },
  });
}
