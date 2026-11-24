import "server-only";

import { cacheLife } from "next/cache";

import { serverEnv } from "@/env.server";

import { getCatalog } from "./catalog";
import type { ServiceArea } from "./catalog-types";
import { getSupabase } from "./supabase";

/*
 * Geo lookups behind our own API routes so the Google key never reaches the
 * browser. Google Places API (New) for autocomplete/details, Geocoding for
 * "use my location", Routes API computeRouteMatrix for distance (the
 * successor to Distance Matrix, which new GCP projects can't enable).
 *
 * Without GOOGLE_MAPS_API_KEY, and only when sample data is allowed, an
 * offline provider answers from the service-area list (straight-line
 * distance × road factor). It exists for local dev and CI, never production.
 */

export interface PlaceSuggestion {
  placeId: string;
  primary: string;
  secondary: string;
}

export interface PlaceDetails {
  placeId: string;
  label: string;
  lat: number;
  lng: number;
}

export interface RouteInfo {
  distanceKm: number;
  durationMinutes: number;
}

export class GeoUnavailableError extends Error {
  constructor() {
    super("Maps lookups are not configured.");
  }
}

const SAMPLE_PREFIX = "sample:";
const ROAD_FACTOR = 1.3;

function googleEnabled(): boolean {
  return serverEnv.googleMapsApiKey !== null;
}

function ensureAvailable(): void {
  if (!googleEnabled() && !serverEnv.allowSampleData) throw new GeoUnavailableError();
}

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

async function googleFetch<T>(
  url: string,
  init: RequestInit & { fieldMask?: string } = {},
): Promise<T> {
  const { fieldMask, headers, ...rest } = init;
  const response = await fetch(url, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": serverEnv.googleMapsApiKey ?? "",
      ...(fieldMask ? { "X-Goog-FieldMask": fieldMask } : {}),
      ...headers,
    },
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) {
    throw new Error(`Google Maps request failed: ${response.status} ${await response.text()}`);
  }
  return (await response.json()) as T;
}

/* ------------------------------------------------------------------------ */
/* Autocomplete                                                              */
/* ------------------------------------------------------------------------ */

export async function autocomplete(
  query: string,
  sessionToken: string,
): Promise<PlaceSuggestion[]> {
  ensureAvailable();
  const q = query.trim();
  if (q.length < 2) return [];

  if (!googleEnabled()) {
    const { areas } = await getCatalog();
    const needle = q.toLowerCase();
    return areas
      .filter(
        (a) => a.name.toLowerCase().includes(needle) || a.state.toLowerCase().includes(needle),
      )
      .slice(0, 6)
      .map((a) => ({ placeId: `${SAMPLE_PREFIX}${a.slug}`, primary: a.name, secondary: a.state }));
  }

  interface Response {
    suggestions?: {
      placePrediction?: {
        placeId: string;
        structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } };
        text?: { text: string };
      };
    }[];
  }
  const data = await googleFetch<Response>("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    body: JSON.stringify({
      input: q,
      sessionToken,
      includedRegionCodes: ["in"],
      languageCode: "en-IN",
    }),
  });
  return (data.suggestions ?? []).flatMap(({ placePrediction: p }) =>
    p
      ? [
          {
            placeId: p.placeId,
            primary: p.structuredFormat?.mainText?.text ?? p.text?.text ?? "",
            secondary: p.structuredFormat?.secondaryText?.text ?? "",
          },
        ]
      : [],
  );
}

/* ------------------------------------------------------------------------ */
/* Place details (cached: ids are stable)                                    */
/* ------------------------------------------------------------------------ */

export async function placeDetails(
  placeId: string,
  sessionToken?: string,
): Promise<PlaceDetails | null> {
  ensureAvailable();
  if (placeId.startsWith(SAMPLE_PREFIX)) {
    if (!serverEnv.allowSampleData) return null;
    const { areas } = await getCatalog();
    const area = areas.find((a) => `${SAMPLE_PREFIX}${a.slug}` === placeId);
    return area
      ? { placeId, label: `${area.name}, ${area.state}`, lat: area.lat, lng: area.lng }
      : null;
  }
  if (!googleEnabled()) return null;
  return googlePlaceDetails(placeId, sessionToken ?? "");
}

async function googlePlaceDetails(
  placeId: string,
  sessionToken: string,
): Promise<PlaceDetails | null> {
  "use cache";
  cacheLife("days");
  interface Response {
    id: string;
    formattedAddress?: string;
    shortFormattedAddress?: string;
    location?: { latitude: number; longitude: number };
  }
  const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`);
  if (sessionToken) url.searchParams.set("sessionToken", sessionToken);
  url.searchParams.set("languageCode", "en-IN");
  const data = await googleFetch<Response>(url.toString(), {
    fieldMask: "id,formattedAddress,shortFormattedAddress,location",
  });
  if (!data.location) return null;
  return {
    placeId: data.id,
    label: data.shortFormattedAddress ?? data.formattedAddress ?? "",
    lat: data.location.latitude,
    lng: data.location.longitude,
  };
}

/* ------------------------------------------------------------------------ */
/* Reverse geocode ("use my location")                                       */
/* ------------------------------------------------------------------------ */

export async function reverseGeocode(lat: number, lng: number): Promise<PlaceDetails | null> {
  ensureAvailable();
  if (!googleEnabled()) {
    const { areas } = await getCatalog();
    const nearest = nearestArea(areas, { lat, lng });
    return nearest
      ? {
          placeId: `${SAMPLE_PREFIX}${nearest.area.slug}`,
          label: `${nearest.area.name}, ${nearest.area.state}`,
          lat: nearest.area.lat,
          lng: nearest.area.lng,
        }
      : null;
  }
  interface Response {
    results?: {
      place_id: string;
      formatted_address: string;
      geometry: { location: { lat: number; lng: number } };
    }[];
  }
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("latlng", `${lat},${lng}`);
  url.searchParams.set("key", serverEnv.googleMapsApiKey ?? "");
  url.searchParams.set("language", "en-IN");
  url.searchParams.set("region", "in");
  const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });
  if (!response.ok) throw new Error(`Geocoding failed: ${response.status}`);
  const first = ((await response.json()) as Response).results?.[0];
  return first
    ? {
        placeId: first.place_id,
        label: first.formatted_address,
        lat: first.geometry.location.lat,
        lng: first.geometry.location.lng,
      }
    : null;
}

/* ------------------------------------------------------------------------ */
/* Route distance (cached in Supabase for ≤ 30 days)                         */
/* ------------------------------------------------------------------------ */

export async function routeInfo(from: PlaceDetails, to: PlaceDetails): Promise<RouteInfo> {
  ensureAvailable();
  if (
    !googleEnabled() ||
    from.placeId.startsWith(SAMPLE_PREFIX) ||
    to.placeId.startsWith(SAMPLE_PREFIX)
  ) {
    const km = haversineKm(from, to) * ROAD_FACTOR;
    return { distanceKm: Math.round(km * 10) / 10, durationMinutes: Math.round((km / 45) * 60) };
  }

  const db = getSupabase();
  if (db) {
    const { data } = await db
      .from("distance_cache")
      .select("distance_m,duration_s,fetched_at")
      .eq("origin_id", from.placeId)
      .eq("destination_id", to.placeId)
      .gte("fetched_at", new Date(Date.now() - 30 * 86_400_000).toISOString())
      .maybeSingle();
    if (data) {
      const row = data as { distance_m: number; duration_s: number };
      return {
        distanceKm: row.distance_m / 1000,
        durationMinutes: Math.round(row.duration_s / 60),
      };
    }
  }

  type Element = { distanceMeters?: number; duration?: string; condition?: string };
  const elements = await googleFetch<Element[]>(
    "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix",
    {
      method: "POST",
      fieldMask: "originIndex,destinationIndex,distanceMeters,duration,condition",
      body: JSON.stringify({
        origins: [{ waypoint: { placeId: from.placeId } }],
        destinations: [{ waypoint: { placeId: to.placeId } }],
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_UNAWARE",
        regionCode: "IN",
      }),
    },
  );
  const element = elements[0];
  if (!element || element.condition !== "ROUTE_EXISTS" || element.distanceMeters === undefined) {
    throw new NoRouteError();
  }
  const durationS = Number.parseInt(element.duration ?? "0", 10);
  if (db) {
    await db.from("distance_cache").upsert({
      origin_id: from.placeId,
      destination_id: to.placeId,
      distance_m: element.distanceMeters,
      duration_s: durationS,
      provider: "google-routes",
      fetched_at: new Date().toISOString(),
    });
  }
  return { distanceKm: element.distanceMeters / 1000, durationMinutes: Math.round(durationS / 60) };
}

export class NoRouteError extends Error {
  constructor() {
    super("No drivable route between these places.");
  }
}

/* ------------------------------------------------------------------------ */
/* Coverage                                                                  */
/* ------------------------------------------------------------------------ */

export function nearestArea(areas: ServiceArea[], point: { lat: number; lng: number }) {
  let best: { area: ServiceArea; km: number } | null = null;
  for (const area of areas) {
    const km = haversineKm(area, point);
    if (!best || km < best.km) best = { area, km };
  }
  return best;
}

/** A route is served when both ends fall within an active service area's radius. */
export function isServed(areas: ServiceArea[], from: PlaceDetails, to: PlaceDetails): boolean {
  const covered = (p: PlaceDetails) => {
    const nearest = nearestArea(areas, p);
    return nearest !== null && nearest.km <= nearest.area.radiusKm;
  };
  return covered(from) && covered(to);
}

/** Static route preview URL on our own origin (the key stays server-side). */
export function staticMapPath(from: PlaceDetails, to: PlaceDetails): string | null {
  if (!googleEnabled()) return null;
  const params = new URLSearchParams({ from: from.placeId, to: to.placeId });
  return `/api/map?${params.toString()}`;
}
