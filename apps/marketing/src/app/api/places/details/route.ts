import { z } from "zod";

import { PlaceIdSchema } from "@truckbuck/types";

import { allowRequest, clientIp } from "@/server/abuse";
import { GeoUnavailableError, placeDetails } from "@/server/geo";
import { badRequest, json, tooManyRequests, unavailable } from "@/server/http";

const QuerySchema = z.object({
  id: PlaceIdSchema,
  session: z.string().uuid().optional(),
});

/** GET /api/places/details?id=<placeId> — label + coordinates (used to restore shared links). */
export async function GET(request: Request) {
  const parsed = QuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return badRequest();
  if (!(await allowRequest("places", clientIp(request.headers)))) return tooManyRequests();

  try {
    const place = await placeDetails(parsed.data.id, parsed.data.session);
    return place ? json({ place }) : json({ error: "not_found" }, { status: 404 });
  } catch (error) {
    if (!(error instanceof GeoUnavailableError)) console.error("place details failed", error);
    return unavailable();
  }
}
