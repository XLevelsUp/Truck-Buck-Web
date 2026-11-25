import { z } from "zod";

import { allowRequest, clientIp } from "@/server/abuse";

const ReportSchema = z.object({
  message: z.string().min(1).max(500),
  source: z.string().max(300),
  path: z
    .string()
    .max(200)
    .regex(/^\/[\w\-/.]*$/),
});

/** POST /api/client-errors — browser errors, forwarded to Sentry when configured. Always 204. */
export async function POST(request: Request) {
  const done = new Response(null, { status: 204 });
  const parsed = ReportSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !process.env.SENTRY_DSN) return done;
  if (!(await allowRequest("clientErrors", clientIp(request.headers)))) return done;
  const { captureClientError } = await import("@/server/sentry");
  captureClientError(parsed.data);
  return done;
}
