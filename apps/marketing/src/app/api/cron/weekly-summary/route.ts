import { timingSafeEqual } from "node:crypto";

import { serverEnv } from "@/env.server";
import { json } from "@/server/http";
import { sendWeeklySummary } from "@/server/weekly-summary";

/**
 * GET /api/cron/weekly-summary — run by Vercel Cron every Monday 09:00 IST
 * (vercel.json). Vercel sends `Authorization: Bearer $CRON_SECRET`; anything
 * else gets 401, so the endpoint can't be used to spam the client's inbox.
 */
export async function GET(request: Request) {
  const secret = serverEnv.cronSecret;
  const given = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret ?? ""}`;
  const ok =
    secret !== null &&
    given.length === expected.length &&
    timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!ok) return json({ error: "unauthorized" }, { status: 401 });

  const result = await sendWeeklySummary();
  return json(
    { status: result.status, ...("reason" in result ? { reason: result.reason } : {}) },
    { status: result.status === "failed" ? 500 : 200 },
  );
}
