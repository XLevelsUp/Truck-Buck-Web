import { z } from "zod";

import { coarsePlace } from "@/lib/places";
import { allowRequest, clientIp } from "@/server/abuse";
import { siteRpc } from "@/server/supabase";

/**
 * POST /api/events — first-party, anonymous estimate log (the funnel's top
 * and the unserved-demand list). Independent of analytics consent because it
 * holds no personal data: places are cut down to "City, State" here on the
 * server and coordinates are rounded to ~10 km by the database. No cookies,
 * IPs or ids are stored. Always 204.
 */

const PlaceSchema = z.object({
  label: z.string().max(300),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

const EstimateEventSchema = z.object({
  outcome: z.enum(["shown", "failed"]),
  reason: z
    .string()
    .regex(/^[a-z_]{1,40}$/)
    .optional(),
  served: z.boolean().optional(),
  from: PlaceSchema.optional(),
  to: PlaceSchema.optional(),
  truck: z
    .string()
    .regex(/^[a-z0-9-]{1,40}$/)
    .optional(),
  distanceKm: z.number().int().min(0).max(10_000).optional(),
  fareMin: z.number().int().min(0).optional(),
  fareMax: z.number().int().min(0).optional(),
  utm: z
    .object({
      utm_source: z.string().max(100).optional(),
      utm_medium: z.string().max(100).optional(),
      utm_campaign: z.string().max(100).optional(),
    })
    .optional(),
  page: z
    .string()
    .max(200)
    .regex(/^\/[\w\-/.]*$/),
});

export async function POST(request: Request) {
  const done = new Response(null, { status: 204 });
  const parsed = EstimateEventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return done;
  if (!(await allowRequest("events", clientIp(request.headers)))) return done;
  const e = parsed.data;
  await siteRpc("site_record_estimate", {
    p_row: {
      outcome: e.outcome,
      reason: e.reason ?? null,
      served: e.served ?? null,
      from_place: e.from ? coarsePlace(e.from.label) : null,
      to_place: e.to ? coarsePlace(e.to.label) : null,
      from_lat: e.from?.lat ?? null,
      from_lng: e.from?.lng ?? null,
      to_lat: e.to?.lat ?? null,
      to_lng: e.to?.lng ?? null,
      truck: e.truck ?? null,
      distance_km: e.distanceKm ?? null,
      fare_min: e.fareMin ?? null,
      fare_max: e.fareMax ?? null,
      utm_source: e.utm?.utm_source ?? null,
      utm_medium: e.utm?.utm_medium ?? null,
      utm_campaign: e.utm?.utm_campaign ?? null,
      page: e.page,
    },
  });
  return done;
}
