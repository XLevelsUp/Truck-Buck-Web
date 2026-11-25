import { z } from "zod";

import { allowRequest, clientIp, verifyTurnstile } from "@/server/abuse";
import { badRequest, json, tooManyRequests } from "@/server/http";
import { humanCookieHeader } from "@/server/human";

const BodySchema = z.object({ token: z.string().min(1).max(2048) });

/** POST /api/human { token } — verifies a Turnstile token, sets the 30-minute bot-check cookie. */
export async function POST(request: Request) {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest();
  const ip = clientIp(request.headers);
  if (!(await allowRequest("human", ip))) return tooManyRequests();
  if (!(await verifyTurnstile(parsed.data.token, ip, "estimate"))) {
    return json({ error: "bot_check" }, { status: 403 });
  }
  return new Response(null, {
    status: 204,
    headers: { "Set-Cookie": humanCookieHeader(), "Cache-Control": "no-store" },
  });
}
