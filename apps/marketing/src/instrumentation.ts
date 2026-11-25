import type { Instrumentation } from "next";

/**
 * Server-side error monitoring (Sentry), only when SENTRY_DSN is set. The
 * browser never loads the Sentry SDK (JS budget): client errors are posted
 * to /api/client-errors and forwarded from here. PII is scrubbed in
 * src/server/sentry.ts before anything leaves the server.
 */
export async function register() {
  // eslint-disable-next-line turbo/no-undeclared-env-vars -- set by Next.js itself, not config.
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.SENTRY_DSN) {
    const { initSentry } = await import("./server/sentry");
    initSentry();
  }
}

export const onRequestError: Instrumentation.onRequestError = async (...args) => {
  // eslint-disable-next-line turbo/no-undeclared-env-vars -- set by Next.js itself, not config.
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(...args);
};
