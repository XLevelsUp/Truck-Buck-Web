import { z } from "zod";

import { allowRequest, clientIp } from "@/server/abuse";
import { autocomplete, GeoUnavailableError } from "@/server/geo";
import { badRequest, json, tooManyRequests, unavailable } from "@/server/http";
import { log } from "@/server/log";

const QuerySchema = z.object({
  q: z.string().trim().min(2).max(120),
  session: z.string().uuid(),
});

/** GET /api/places/autocomplete?q=chen&session=<uuid> — India-only place suggestions. */
export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = QuerySchema.safeParse(params);
  if (!parsed.success) return badRequest();
  if (!(await allowRequest("places", clientIp(request.headers)))) return tooManyRequests();

  try {
    return json({ suggestions: await autocomplete(parsed.data.q, parsed.data.session) });
  } catch (error) {
    if (!(error instanceof GeoUnavailableError)) log.error("autocomplete failed", error);
    return unavailable();
  }
}
