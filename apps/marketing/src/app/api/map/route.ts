import { z } from "zod";

import { PlaceIdSchema } from "@truckbuck/types";
import { themes } from "@truckbuck/ui/tokens";

import { serverEnv } from "@/env.server";
import { allowRequest, clientIp } from "@/server/abuse";
import { placeDetails } from "@/server/geo";
import { badRequest, unavailable } from "@/server/http";

const QuerySchema = z.object({ from: PlaceIdSchema, to: PlaceIdSchema });

const toStaticColor = (hex: string) => `0x${hex.slice(1)}`;

/**
 * GET /api/map?from=&to= — static route preview (Google Static Maps),
 * proxied so the API key never reaches the browser. A plain image: no Maps
 * JavaScript, nothing on the LCP path.
 */
export async function GET(request: Request) {
  const key = serverEnv.googleMapsApiKey;
  if (!key) return unavailable();
  const parsed = QuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return badRequest();
  if (!(await allowRequest("map", clientIp(request.headers))))
    return new Response(null, { status: 429 });

  const [from, to] = await Promise.all([
    placeDetails(parsed.data.from),
    placeDetails(parsed.data.to),
  ]);
  if (!from || !to) return badRequest("place_not_found");

  const brand = toStaticColor(themes.light.primary);
  const accent = toStaticColor(themes.light.accent);
  const url = new URL("https://maps.googleapis.com/maps/api/staticmap");
  url.searchParams.set("size", "640x360");
  url.searchParams.set("scale", "2");
  url.searchParams.set("language", "en");
  url.searchParams.set("region", "in");
  url.searchParams.append("markers", `color:${brand}|label:A|${from.lat},${from.lng}`);
  url.searchParams.append("markers", `color:${accent}|label:B|${to.lat},${to.lng}`);
  url.searchParams.set(
    "path",
    `color:${brand}cc|weight:4|geodesic:true|${from.lat},${from.lng}|${to.lat},${to.lng}`,
  );
  url.searchParams.set("key", key);

  const upstream = await fetch(url, { signal: AbortSignal.timeout(8_000) });
  if (!upstream.ok || !upstream.body) return unavailable();
  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
