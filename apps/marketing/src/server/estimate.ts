import "server-only";

import { priceQuote } from "@truckbuck/pricing";
import type { EstimateRequest, EstimateResponse } from "@truckbuck/types";
import { toISTDateKey } from "@truckbuck/utils";

import { getCatalog, getRateCard } from "./catalog";
import {
  GeoUnavailableError,
  isServed,
  NoRouteError,
  placeDetails,
  routeInfo,
  staticMapPath,
} from "./geo";

export type EstimateError =
  "place_not_found" | "invalid_truck" | "no_route" | "unavailable" | "past_date";

export type EstimateOutcome =
  { ok: true; estimate: EstimateResponse } | { ok: false; error: EstimateError };

/** Default pickup time when only a future date is chosen: 09:00 IST. */
const DEFAULT_PICKUP_HOUR_IST = 9;

export function pickupInstant(date: string, now: Date): Date | null {
  const today = toISTDateKey(now);
  if (date < today) return null;
  if (date === today) return now;
  return new Date(`${date}T${String(DEFAULT_PICKUP_HOUR_IST).padStart(2, "0")}:00:00+05:30`);
}

/**
 * The one place an estimate is computed — used by POST /api/estimate and
 * again inside the lead action, so a lead never trusts a fare the browser
 * sent. Not-served routes still return distance, with `quote: null`.
 */
export async function computeEstimate(
  request: EstimateRequest,
  now: Date = new Date(),
): Promise<EstimateOutcome> {
  try {
    const pickupAt = pickupInstant(request.date, now);
    if (!pickupAt) return { ok: false, error: "past_date" };

    const catalog = await getCatalog();
    const truck = catalog.trucks.find((t) => t.slug === request.truck);
    if (!truck) return { ok: false, error: "invalid_truck" };

    const [from, to] = await Promise.all([placeDetails(request.from), placeDetails(request.to)]);
    if (!from || !to) return { ok: false, error: "place_not_found" };

    const route = await routeInfo(from, to);
    const served = isServed(catalog.areas, from, to);
    const rate = served ? await getRateCard(truck.slug) : null;
    const quote = rate
      ? priceQuote(
          { distanceKm: route.distanceKm, truckType: truck.slug, pickupAt, now },
          rate.card,
        )
      : null;

    return {
      ok: true,
      estimate: {
        from,
        to,
        truck: { slug: truck.slug, name: truck.name },
        date: request.date,
        distanceKm: Math.round(route.distanceKm),
        served,
        quote:
          quote && rate
            ? {
                fare: quote.fare,
                transitHours: quote.transitHours,
                gstPct: quote.gstPct,
                includes: quote.includes,
                excludes: quote.excludes,
                surcharges: quote.surcharges,
                rateCardVersion: quote.rateCardVersion,
                sample: rate.isSample,
              }
            : null,
        mapUrl: staticMapPath(from, to),
      },
    };
  } catch (error) {
    if (error instanceof NoRouteError) return { ok: false, error: "no_route" };
    if (error instanceof GeoUnavailableError) return { ok: false, error: "unavailable" };
    console.error("computeEstimate failed", error);
    return { ok: false, error: "unavailable" };
  }
}
