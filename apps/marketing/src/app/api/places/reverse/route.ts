import { z } from "zod";

import { allowRequest, clientIp } from "@/server/abuse";
import { GeoUnavailableError, reverseGeocode } from "@/server/geo";
import { badRequest, json, tooManyRequests, unavailable } from "@/server/http";
import { log } from "@/server/log";

// India's bounding box, with margin.
const QuerySchema = z.object({
  lat: z.coerce.number().min(5).max(38),
  lng: z.coerce.number().min(67).max(98),
});

/** GET /api/places/reverse?lat=&lng= — "Use my location" for the pickup field. */
export async function GET(request: Request) {
  const parsed = QuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return badRequest("outside_india");
  if (!(await allowRequest("places", clientIp(request.headers)))) return tooManyRequests();

  try {
    const place = await reverseGeocode(parsed.data.lat, parsed.data.lng);
    return place ? json({ place }) : json({ error: "not_found" }, { status: 404 });
  } catch (error) {
    if (!(error instanceof GeoUnavailableError)) log.error("reverse geocode failed", error);
    return unavailable();
  }
}
