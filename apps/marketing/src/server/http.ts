import "server-only";

/** JSON response that is never cached by browsers or CDNs. */
export function json(body: unknown, init: ResponseInit = {}): Response {
  return Response.json(body, {
    ...init,
    headers: { "Cache-Control": "no-store", ...init.headers },
  });
}

export const tooManyRequests = () =>
  json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": "60" } });

export const badRequest = (error = "invalid") => json({ error }, { status: 400 });

export const unavailable = () => json({ error: "unavailable" }, { status: 503 });
