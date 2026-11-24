import type { RateCard } from "./rate-card";

export interface QuoteInput {
  /** Road distance in km (any precision; billed in whole km). */
  distanceKm: number;
  /** Truck type slug; must match the rate card. */
  truckType: string;
  /** Requested pickup instant. A time in the past is treated as "now". */
  pickupAt: Date;
  /** The current instant. Pass it explicitly to keep quotes reproducible. Default: now. */
  now?: Date;
}

export type QuoteLineKind = "base" | "distance" | "night" | "urgent";

export interface QuoteLine {
  kind: QuoteLineKind;
  amountPaise: number;
}

export interface Quote {
  truckType: string;
  rateCardVersion: string;
  /** Distance actually billed: whole km, at least the card's minimum. */
  chargeableKm: number;
  /** Itemised pre-tax charges (integer paise). */
  lines: QuoteLine[];
  /** Pre-tax point estimate. */
  subtotalPaise: number;
  gstPct: number;
  /** The fare range shown to the shopper, GST included, rounded outwards. Always min < max. */
  fare: { minPaise: number; maxPaise: number };
  /** GST inside each end of the range (before rounding). */
  gst: { minPaise: number; maxPaise: number };
  surcharges: { night: boolean; urgent: boolean };
  /** Estimated door-to-door hours, including loading and driver rest. */
  transitHours: { min: number; max: number };
  includes: string[];
  excludes: string[];
}

const IST_OFFSET_MINUTES = 330;
const HOUR_MS = 60 * 60 * 1000;
/** Drivers rest roughly 8 h for every 10 h on the road. */
const DRIVE_HOURS_PER_DAY = 10;
const REST_HOURS = 8;
/** Upper end of the transit range: traffic, checkposts, loading delays. */
const TRANSIT_SLACK = 1.25;

function istHour(date: Date): number {
  const minutes = date.getUTCHours() * 60 + date.getUTCMinutes() + IST_OFFSET_MINUTES;
  return Math.floor((minutes % (24 * 60)) / 60);
}

function inWindow(hour: number, start: number, end: number): boolean {
  if (start === end) return false;
  return start < end ? hour >= start && hour < end : hour >= start || hour < end;
}

/** Progressive slabs: each km is charged at the rate of the slab it falls in. */
export function distanceFarePaise(km: number, card: Pick<RateCard, "kmSlabs">): number {
  let total = 0;
  let floor = 0;
  for (const slab of card.kmSlabs) {
    const ceiling = slab.upToKm ?? Number.POSITIVE_INFINITY;
    const kmInSlab = Math.min(km, ceiling) - floor;
    if (kmInSlab <= 0) break;
    total += kmInSlab * slab.perKmPaise;
    floor = ceiling;
  }
  return total;
}

function percentOf(amount: number, pct: number): number {
  return Math.round((amount * pct) / 100);
}

/**
 * Prices a full-truck-load trip from a rate card. Pure and deterministic
 * (pass `now`): no I/O, no globals. Always returns a range.
 *
 * subtotal = base + distance(slabs, ≥ minKm) + night% + urgent%   (surcharges on base + distance, not compounded)
 * range    = subtotal × (1 − low%, 1 + high%) × (1 + GST%), min rounded down and max rounded up to `roundToPaise`
 */
export function priceQuote(input: QuoteInput, card: RateCard): Quote {
  const { distanceKm, truckType, pickupAt } = input;
  const now = input.now ?? new Date();

  if (truckType !== card.truckTypeSlug) {
    throw new Error(
      `Rate card ${card.version} is for "${card.truckTypeSlug}", not "${truckType}".`,
    );
  }
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
    throw new RangeError(`Distance must be a positive number of km, got ${distanceKm}.`);
  }
  if (Number.isNaN(pickupAt.getTime()) || Number.isNaN(now.getTime())) {
    throw new RangeError("Invalid pickup or current date.");
  }

  const effectivePickup = pickupAt.getTime() < now.getTime() ? now : pickupAt;
  const chargeableKm = Math.max(Math.ceil(distanceKm - 1e-9), card.minKm);
  const distance = distanceFarePaise(chargeableKm, card);
  const preSurcharge = card.baseFarePaise + distance;

  const night = inWindow(istHour(effectivePickup), card.nightStartHourIst, card.nightEndHourIst);
  const hoursAhead = (effectivePickup.getTime() - now.getTime()) / HOUR_MS;
  const urgent = card.urgentWithinHours > 0 && hoursAhead < card.urgentWithinHours;

  const lines: QuoteLine[] = [
    { kind: "base", amountPaise: card.baseFarePaise },
    { kind: "distance", amountPaise: distance },
  ];
  if (night && card.nightSurchargePct > 0) {
    lines.push({ kind: "night", amountPaise: percentOf(preSurcharge, card.nightSurchargePct) });
  }
  if (urgent && card.urgentSurchargePct > 0) {
    lines.push({ kind: "urgent", amountPaise: percentOf(preSurcharge, card.urgentSurchargePct) });
  }
  const subtotalPaise = lines.reduce((sum, line) => sum + line.amountPaise, 0);

  const lowPreTax = subtotalPaise * (1 - card.rangeLowPct / 100);
  const highPreTax = subtotalPaise * (1 + card.rangeHighPct / 100);
  const gstMin = (lowPreTax * card.gstPct) / 100;
  const gstMax = (highPreTax * card.gstPct) / 100;

  const unit = card.roundToPaise;
  let minPaise = Math.floor((lowPreTax + gstMin) / unit) * unit;
  let maxPaise = Math.ceil((highPreTax + gstMax) / unit) * unit;
  // A range must be a range, and never ₹0.
  minPaise = Math.max(minPaise, unit);
  if (maxPaise <= minPaise) maxPaise = minPaise + unit;

  const driveHours = distanceKm / card.avgSpeedKmph;
  const restHours = Math.max(0, Math.ceil(driveHours / DRIVE_HOURS_PER_DAY) - 1) * REST_HOURS;
  const transitMin = Math.max(1, Math.round(driveHours + restHours + card.loadingHours));
  const transitMax = Math.max(transitMin + 1, Math.ceil(transitMin * TRANSIT_SLACK));

  return {
    truckType,
    rateCardVersion: card.version,
    chargeableKm,
    lines,
    subtotalPaise,
    gstPct: card.gstPct,
    fare: { minPaise, maxPaise },
    gst: { minPaise: Math.round(gstMin), maxPaise: Math.round(gstMax) },
    surcharges: { night, urgent },
    transitHours: { min: transitMin, max: transitMax },
    includes: [...card.includes],
    excludes: [...card.excludes],
  };
}
