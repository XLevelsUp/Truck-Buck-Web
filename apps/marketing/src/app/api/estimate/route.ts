import { EstimateRequestSchema } from "@truckbuck/types";

import { allowRequest, clientIp } from "@/server/abuse";
import { computeEstimateCached } from "@/server/estimate";
import { badRequest, json, tooManyRequests } from "@/server/http";
import { hasHumanCookie } from "@/server/human";

/** Identical inputs → identical answer for 5 minutes (CDN + server cache). */
const CACHE = "public, max-age=0, s-maxage=300, stale-while-revalidate=60";

/**
 * GET /api/estimate?from=&to=&truck=&date=[&weightTonnes=&material=]
 *
 * A GET so the CDN can cache identical requests. Guarded by the bot-check
 * cookie (POST /api/human) and a per-IP rate limit on every cache miss.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const weight = params.get("weightTonnes");
  const parsed = EstimateRequestSchema.safeParse({
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
    truck: params.get("truck") ?? undefined,
    date: params.get("date") ?? undefined,
    ...(weight ? { weightTonnes: Number(weight) } : {}),
    ...(params.get("material") ? { material: params.get("material") } : {}),
  });
  if (!parsed.success) return badRequest();
  if (!hasHumanCookie(request.headers)) return json({ error: "bot_check" }, { status: 403 });
  if (!(await allowRequest("estimate", clientIp(request.headers)))) return tooManyRequests();

  const outcome = await computeEstimateCached(parsed.data);
  if (outcome.ok) {
    return json({ estimate: outcome.estimate }, { headers: { "Cache-Control": CACHE } });
  }
  const status = outcome.error === "unavailable" ? 503 : 422;
  return json({ error: outcome.error }, { status });
}
