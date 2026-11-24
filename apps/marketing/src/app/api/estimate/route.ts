import { EstimateRequestSchema } from "@truckbuck/types";

import { allowRequest, clientIp } from "@/server/abuse";
import { computeEstimate } from "@/server/estimate";
import { badRequest, json, tooManyRequests } from "@/server/http";

/**
 * POST /api/estimate — instant fare estimate. Rate-limited per IP.
 * Body: { from, to, truck, date, weightTonnes?, material? }
 */
export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = EstimateRequestSchema.safeParse(body);
  if (!parsed.success) return badRequest();
  if (!(await allowRequest("estimate", clientIp(request.headers)))) return tooManyRequests();

  const outcome = await computeEstimate(parsed.data);
  if (outcome.ok) return json({ estimate: outcome.estimate });
  const status = outcome.error === "unavailable" ? 503 : 422;
  return json({ error: outcome.error }, { status });
}
