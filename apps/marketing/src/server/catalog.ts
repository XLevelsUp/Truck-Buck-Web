import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { type RateCard, RateCardSchema } from "@truckbuck/pricing";

import { serverEnv } from "@/env.server";

import type {
  Catalog,
  ClientLogoRecord,
  Faq,
  Lane,
  ServiceArea,
  SiteMetric,
  TestimonialRecord,
  TruckIconKey,
  TruckType,
} from "./catalog-types";
import { sampleAreas, sampleFaqs, sampleLanes, sampleRateCards, sampleTrucks } from "./sample-data";
import { getSupabase } from "./supabase";

/*
 * Read side of the marketing data. Cached for an hour (ISR-style); call
 * revalidateTag("catalog") after editing rows to refresh immediately.
 *
 * Sample rule: if a table has any real (is_sample = false) rows, sample rows
 * are ignored. Otherwise sample rows are used only when sample data is
 * allowed (dev/preview). Production never shows sample data.
 */

function pick<T extends { is_sample: boolean }>(rows: T[]): { rows: T[]; sample: boolean } {
  const real = rows.filter((row) => !row.is_sample);
  if (real.length > 0) return { rows: real, sample: false };
  return serverEnv.allowSampleData
    ? { rows, sample: rows.length > 0 }
    : { rows: [], sample: false };
}

interface TruckRow {
  slug: string;
  name: string;
  body_type: string;
  icon_key: TruckIconKey;
  length_ft: number;
  payload_tonnes: number;
  good_for: string | null;
  class: string;
  width_ft: number | null;
  height_ft: number | null;
  pallets: number | null;
  typical_loads: string[] | null;
  image_url: string | null;
  image_alt: string | null;
  is_sample: boolean;
}

interface AreaRow {
  slug: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  radius_km: number;
  is_sample: boolean;
}

export async function getCatalog(): Promise<Catalog> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");

  const db = getSupabase();
  if (!db) {
    if (!serverEnv.allowSampleData)
      return { trucks: [], areas: [], lanes: [], usesSampleData: false };
    return { trucks: sampleTrucks, areas: sampleAreas, lanes: sampleLanes, usesSampleData: true };
  }

  const [trucksResult, areasResult, lanesResult] = await Promise.all([
    db
      .from("truck_types")
      .select(
        "slug,name,body_type,icon_key,length_ft,payload_tonnes,good_for,class,width_ft,height_ft,pallets,typical_loads,image_url,image_alt,is_sample",
      )
      .eq("active", true)
      .order("sort_order"),
    db
      .from("service_areas")
      .select("slug,name,state,lat,lng,radius_km,is_sample")
      .eq("active", true)
      .order("name"),
    db.from("lanes").select("from_slug,to_slug,is_sample").eq("active", true),
  ]);
  for (const result of [trucksResult, areasResult, lanesResult]) {
    if (result.error) throw new Error(`Catalog query failed: ${result.error.message}`);
  }

  const trucks = pick((trucksResult.data ?? []) as TruckRow[]);
  const areas = pick((areasResult.data ?? []) as AreaRow[]);
  const lanes = pick(
    (lanesResult.data ?? []) as { from_slug: string; to_slug: string; is_sample: boolean }[],
  );
  const areaSlugs = new Set(areas.rows.map((a) => a.slug));

  return {
    trucks: trucks.rows.map((row): TruckType => ({
      slug: row.slug,
      name: row.name,
      bodyType: row.body_type,
      iconKey: row.icon_key,
      lengthFt: Number(row.length_ft),
      payloadTonnes: Number(row.payload_tonnes),
      goodFor: row.good_for,
      truckClass: row.class,
      widthFt: row.width_ft === null ? null : Number(row.width_ft),
      heightFt: row.height_ft === null ? null : Number(row.height_ft),
      pallets: row.pallets,
      typicalLoads: row.typical_loads ?? [],
      imageUrl: row.image_url,
      imageAlt: row.image_alt,
      isSample: row.is_sample,
    })),
    areas: areas.rows.map((row): ServiceArea => ({
      slug: row.slug,
      name: row.name,
      state: row.state,
      lat: row.lat,
      lng: row.lng,
      radiusKm: row.radius_km,
      isSample: row.is_sample,
    })),
    lanes: lanes.rows
      .filter((row) => areaSlugs.has(row.from_slug) && areaSlugs.has(row.to_slug))
      .map((row): Lane => ({ from: row.from_slug, to: row.to_slug })),
    usesSampleData: trucks.sample || areas.sample || lanes.sample,
  };
}

interface RateCardRow {
  truck_type_slug: string;
  version: string;
  base_fare_paise: number;
  min_km: number;
  km_slabs: { up_to_km: number | null; per_km_paise: number }[];
  loading_hours: number;
  avg_speed_kmph: number;
  night_surcharge_pct: number;
  night_start_hour_ist: number;
  night_end_hour_ist: number;
  urgent_surcharge_pct: number;
  urgent_within_hours: number;
  gst_pct: number;
  range_low_pct: number;
  range_high_pct: number;
  round_to_paise: number;
  includes: string[];
  excludes: string[];
  is_sample: boolean;
}

/** Server-only: never pass a rate card to the browser. */
export async function getRateCard(
  truckSlug: string,
): Promise<{ card: RateCard; isSample: boolean } | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog", "rate-cards");

  const db = getSupabase();
  if (!db) {
    const card = serverEnv.allowSampleData
      ? sampleRateCards.find((c) => c.truckTypeSlug === truckSlug)
      : undefined;
    return card ? { card, isSample: true } : null;
  }

  const { data, error } = await db
    .from("rate_cards")
    .select("*")
    .eq("truck_type_slug", truckSlug)
    .eq("active", true);
  if (error) throw new Error(`Rate card query failed: ${error.message}`);

  const rows = (data ?? []) as RateCardRow[];
  const row = rows.find((r) => !r.is_sample) ?? (serverEnv.allowSampleData ? rows[0] : undefined);
  if (!row) return null;

  const card = RateCardSchema.parse({
    truckTypeSlug: row.truck_type_slug,
    version: row.version,
    baseFarePaise: row.base_fare_paise,
    minKm: row.min_km,
    kmSlabs: row.km_slabs.map((s) => ({ upToKm: s.up_to_km, perKmPaise: s.per_km_paise })),
    loadingHours: Number(row.loading_hours),
    avgSpeedKmph: Number(row.avg_speed_kmph),
    nightSurchargePct: Number(row.night_surcharge_pct),
    nightStartHourIst: row.night_start_hour_ist,
    nightEndHourIst: row.night_end_hour_ist,
    urgentSurchargePct: Number(row.urgent_surcharge_pct),
    urgentWithinHours: Number(row.urgent_within_hours),
    gstPct: Number(row.gst_pct),
    rangeLowPct: Number(row.range_low_pct),
    rangeHighPct: Number(row.range_high_pct),
    roundToPaise: row.round_to_paise,
    includes: row.includes,
    excludes: row.excludes,
  });
  return { card, isSample: row.is_sample };
}

export async function getFaqs(page: string): Promise<Faq[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("faqs");

  const db = getSupabase();
  if (!db) return serverEnv.allowSampleData && page === "home" ? sampleFaqs : [];
  const { data, error } = await db
    .from("faqs")
    .select("question,answer")
    .eq("page", page)
    .eq("locale", "en")
    .eq("published", true)
    .order("sort_order");
  if (error) throw new Error(`FAQ query failed: ${error.message}`);
  return data ?? [];
}

/**
 * Only published rows with consent/permission on file AND a named approver.
 * The database enforces the same rules with check constraints.
 */
export async function getSocialProof(): Promise<{
  testimonials: TestimonialRecord[];
  logos: ClientLogoRecord[];
}> {
  "use cache";
  cacheLife("hours");
  cacheTag("social-proof");

  const db = getSupabase();
  if (!db) return { testimonials: [], logos: [] };
  const [testimonials, logos] = await Promise.all([
    db
      .from("testimonials")
      .select("quote,name,role,company")
      .eq("published", true)
      .eq("consent_on_file", true)
      .not("approved_at", "is", null)
      .order("sort_order"),
    db
      .from("client_logos")
      .select("name,logo_url")
      .eq("published", true)
      .eq("permission_on_file", true)
      .not("approved_at", "is", null)
      .order("sort_order"),
  ]);
  return {
    testimonials: testimonials.data ?? [],
    logos: ((logos.data ?? []) as { name: string; logo_url: string }[]).map((l) => ({
      name: l.name,
      logoUrl: l.logo_url,
    })),
  };
}

/* -------------------------------------------------------------------------- */
/* Site config (fees, charges) — editable by ops without a deploy             */
/* -------------------------------------------------------------------------- */

export interface TransporterFeeConfig {
  model: "per_trip_percent";
  percent: number | null;
  minimum_paise: number | null;
  payout_days: number | null;
}

export interface ShipperChargesConfig {
  waiting_free_hours: number | null;
  waiting_per_hour_paise: number | null;
  cancellation: string | null;
  payment_terms: string | null;
}

export interface MetricThresholdsConfig {
  trips_completed: number | null;
  transporters_onboarded: number | null;
  max_age_days: number;
}

interface SiteConfigShape {
  "transporter.fee": TransporterFeeConfig;
  "shipper.charges": ShipperChargesConfig;
  "metrics.thresholds": MetricThresholdsConfig;
}

/** Defaults mirror the seed: unknown values are null and render as missing-fact markers. */
const siteConfigDefaults: SiteConfigShape = {
  "transporter.fee": {
    model: "per_trip_percent",
    percent: null,
    minimum_paise: null,
    payout_days: null,
  },
  "shipper.charges": {
    waiting_free_hours: null,
    waiting_per_hour_paise: null,
    cancellation: null,
    payment_terms: null,
  },
  "metrics.thresholds": { trips_completed: null, transporters_onboarded: null, max_age_days: 7 },
};

export async function getSiteConfig<K extends keyof SiteConfigShape>(
  key: K,
): Promise<SiteConfigShape[K]> {
  "use cache";
  cacheLife("hours");
  cacheTag("site-config");

  const db = getSupabase();
  if (!db) return siteConfigDefaults[key];
  const { data } = await db
    .from("site_config")
    .select("value,is_sample")
    .eq("key", key)
    .maybeSingle<{ value: Partial<SiteConfigShape[K]>; is_sample: boolean }>();
  if (!data || (data.is_sample && !serverEnv.allowSampleData)) return siteConfigDefaults[key];
  return { ...siteConfigDefaults[key], ...data.value };
}

/**
 * Live counters. Only real counts written by the booking system's job
 * (site_metrics), only while fresh, and only at or above the client's
 * threshold. No database, no row, no threshold or a stale row = nothing shown.
 * There is deliberately no sample fallback.
 */
export async function getSiteMetrics(): Promise<SiteMetric[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("site-metrics");

  const db = getSupabase();
  if (!db) return [];
  const thresholds = await getSiteConfig("metrics.thresholds");
  const { data, error } = await db.from("site_metrics").select("key,value,measured_at");
  if (error || !data) return [];
  const maxAgeMs = thresholds.max_age_days * 24 * 60 * 60 * 1000;
  const now = Date.now();
  return (data as { key: SiteMetric["key"]; value: number; measured_at: string }[])
    .filter((row) => {
      const minimum = thresholds[row.key];
      if (minimum === null || row.value < minimum) return false;
      return now - new Date(row.measured_at).getTime() <= maxAgeMs;
    })
    .map((row) => ({ key: row.key, value: Number(row.value), measuredAt: row.measured_at }));
}
