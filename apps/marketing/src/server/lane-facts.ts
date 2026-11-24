import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { priceQuote, recommendTruck } from "@truckbuck/pricing";

import { getCatalog, getRateCard } from "./catalog";
import type { Lane, ServiceArea, TruckType } from "./catalog-types";
import { type AreaRoute, areaRoute, haversineKm } from "./geo";

/** /truck-booking/<from>-to-<to>. City slugs can never contain "-to-" (DB check). */
export const laneSlug = (from: string, to: string) => `${from}-to-${to}`;

export function parseLaneSlug(slug: string): { from: string; to: string } | null {
  const parts = slug.split("-to-");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return { from: parts[0], to: parts[1] };
}

/** Why a page is not indexable yet; empty = complete, real data. */
export type MissingData =
  | "sample_city"
  | "sample_lane"
  | "no_real_lanes"
  | "no_real_trucks"
  | "estimated_distance"
  | "no_real_rates"
  | "lane_facts";

export interface RouteFare {
  truck: TruckType;
  minPaise: number;
  maxPaise: number;
  transitHours: { min: number; max: number };
  sample: boolean;
}

export interface GoodsSuggestion {
  goods: string;
  tonnes: number;
  truck: TruckType | null;
}

export interface RouteFacts {
  slug: string;
  from: ServiceArea;
  to: ServiceArea;
  lane: Lane;
  route: AreaRoute;
  fares: RouteFare[];
  gstPct: number | null;
  includes: string[];
  excludes: string[];
  suggestions: GoodsSuggestion[];
  reverse: string | null;
  /** Other lanes touching either city, for internal links. */
  related: { slug: string; from: ServiceArea; to: ServiceArea }[];
  missing: MissingData[];
  indexable: boolean;
}

export interface CityFacts {
  area: ServiceArea;
  lanes: { slug: string; from: ServiceArea; to: ServiceArea }[];
  trucks: TruckType[];
  nearby: { area: ServiceArea; km: number }[];
  missing: MissingData[];
  indexable: boolean;
}

/**
 * Reference pickup used for the fare table: a weekday 09:00 IST a week
 * ahead, so no night or same-day surcharge applies. Stated on the page.
 */
function referencePickup(now: Date): { pickupAt: Date; now: Date } {
  const day = new Date(now.getTime() + 7 * 86_400_000);
  const ist = new Date(day.getTime() + 330 * 60_000).toISOString().slice(0, 10);
  return { pickupAt: new Date(`${ist}T09:00:00+05:30`), now };
}

/** "Cotton yarn:9" → { goods: "Cotton yarn", tonnes: 9 }. */
function parseGoods(entry: string): { goods: string; tonnes: number } | null {
  const index = entry.lastIndexOf(":");
  if (index <= 0) return null;
  const tonnes = Number(entry.slice(index + 1));
  const goods = entry.slice(0, index).trim();
  return goods && Number.isFinite(tonnes) && tonnes > 0 ? { goods, tonnes } : null;
}

function lanePages(catalog: Awaited<ReturnType<typeof getCatalog>>) {
  const byslug = new Map(catalog.areas.map((area) => [area.slug, area]));
  return catalog.lanes.flatMap((lane) => {
    const from = byslug.get(lane.from);
    const to = byslug.get(lane.to);
    return from && to ? [{ slug: laneSlug(lane.from, lane.to), lane, from, to }] : [];
  });
}

/** Every city page: served areas from `service_areas`. */
export async function getCitySlugs(): Promise<string[]> {
  const catalog = await getCatalog();
  return catalog.areas.map((area) => area.slug);
}

/** Every route page: lanes from `lanes` whose two cities are served. */
export async function getLaneSlugs(): Promise<string[]> {
  return lanePages(await getCatalog()).map((page) => page.slug);
}

export async function getRouteFacts(slug: string): Promise<RouteFacts | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog", "lane-pages");

  const parsed = parseLaneSlug(slug);
  if (!parsed) return null;
  const catalog = await getCatalog();
  const pages = lanePages(catalog);
  const page = pages.find((p) => p.slug === slug);
  if (!page) return null;
  const { lane, from, to } = page;

  const route = await areaRoute(from, to);
  const { pickupAt, now } = referencePickup(new Date());
  const fares: RouteFare[] = [];
  let gstPct: number | null = null;
  let includes: string[] = [];
  let excludes: string[] = [];
  for (const truck of catalog.trucks) {
    const rate = await getRateCard(truck.slug);
    if (!rate) continue;
    const quote = priceQuote(
      { distanceKm: route.distanceKm, truckType: truck.slug, pickupAt, now },
      rate.card,
    );
    gstPct ??= quote.gstPct;
    if (includes.length === 0) ({ includes, excludes } = quote);
    fares.push({
      truck,
      minPaise: quote.fare.minPaise,
      maxPaise: quote.fare.maxPaise,
      transitHours: quote.transitHours,
      sample: rate.isSample,
    });
  }

  const advisorTrucks = catalog.trucks.map((truck) => ({
    slug: truck.slug,
    bodyType: truck.bodyType,
    payloadTonnes: truck.payloadTonnes,
    lengthFt: truck.lengthFt,
    widthFt: truck.widthFt,
    heightFt: truck.heightFt,
    pallets: truck.pallets,
  }));
  const suggestions: GoodsSuggestion[] = lane.factsReviewed
    ? lane.commonGoods.flatMap((entry) => {
        const goods = parseGoods(entry);
        if (!goods) return [];
        const result = recommendTruck(
          { weightTonnes: goods.tonnes, material: "general" },
          advisorTrucks,
        );
        const truck =
          result.kind === "match"
            ? (catalog.trucks.find((t) => t.slug === result.truck.slug) ?? null)
            : null;
        return [{ ...goods, truck }];
      })
    : [];

  const reverseSlug = laneSlug(lane.to, lane.from);
  const related = pages
    .filter(
      (p) =>
        p.slug !== slug &&
        p.slug !== reverseSlug &&
        [p.lane.from, p.lane.to].some((c) => c === lane.from || c === lane.to),
    )
    .slice(0, 6)
    .map(({ slug: s, from: f, to: t }) => ({ slug: s, from: f, to: t }));

  const missing: MissingData[] = [];
  if (from.isSample || to.isSample) missing.push("sample_city");
  if (lane.isSample) missing.push("sample_lane");
  if (route.source !== "google") missing.push("estimated_distance");
  if (fares.length === 0 || fares.some((fare) => fare.sample)) missing.push("no_real_rates");
  if (catalog.trucks.length === 0 || catalog.trucks.some((t) => t.isSample)) {
    missing.push("no_real_trucks");
  }
  if (!lane.factsReviewed || lane.highways.length === 0) missing.push("lane_facts");

  return {
    slug,
    from,
    to,
    lane,
    route,
    fares,
    gstPct,
    includes,
    excludes,
    suggestions,
    reverse: pages.some((p) => p.slug === reverseSlug) ? reverseSlug : null,
    related,
    missing,
    indexable: missing.length === 0,
  };
}

export async function getCityFacts(slug: string): Promise<CityFacts | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog", "city-pages");

  const catalog = await getCatalog();
  const area = catalog.areas.find((a) => a.slug === slug);
  if (!area) return null;
  const lanes = lanePages(catalog)
    .filter((p) => p.lane.from === slug || p.lane.to === slug)
    .map(({ slug: s, from, to }) => ({ slug: s, from, to }));
  const nearby = catalog.areas
    .filter((a) => a.slug !== slug)
    .map((a) => ({ area: a, km: Math.round(haversineKm(area, a)) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 4);

  const realLanes = catalog.lanes.filter((l) => !l.isSample && (l.from === slug || l.to === slug));
  const missing: MissingData[] = [];
  if (area.isSample) missing.push("sample_city");
  if (realLanes.length === 0) missing.push("no_real_lanes");
  if (catalog.trucks.length === 0 || catalog.trucks.some((t) => t.isSample)) {
    missing.push("no_real_trucks");
  }

  return {
    area,
    lanes,
    trucks: catalog.trucks,
    nearby,
    missing,
    indexable: missing.length === 0,
  };
}

/**
 * The least a truck can cost for any trip (its rate card's minimum charge,
 * GST included), for Product structured data. Null without a real rate card.
 */
export async function getMinimumFare(truckSlug: string): Promise<number | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog", "rate-cards");

  const rate = await getRateCard(truckSlug);
  if (!rate || rate.isSample) return null;
  const { pickupAt, now } = referencePickup(new Date());
  return priceQuote(
    { distanceKm: Math.max(1, rate.card.minKm), truckType: truckSlug, pickupAt, now },
    rate.card,
  ).fare.minPaise;
}
