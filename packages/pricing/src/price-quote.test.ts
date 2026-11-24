import { describe, expect, it } from "vitest";

import { distanceFarePaise, priceQuote } from "./price-quote";
import { type RateCard, RateCardSchema } from "./rate-card";

/** Test fixture — round numbers chosen for hand-checkable arithmetic, not real rates. */
const card: RateCard = {
  truckTypeSlug: "lcv-14ft",
  version: "test-1",
  baseFarePaise: 200_000, // ₹2,000
  minKm: 50,
  kmSlabs: [
    { upToKm: 100, perKmPaise: 4_000 }, // ₹40/km for km 1–100
    { upToKm: 500, perKmPaise: 3_000 }, // ₹30/km for km 101–500
    { upToKm: null, perKmPaise: 2_500 }, // ₹25/km beyond 500
  ],
  loadingHours: 2,
  avgSpeedKmph: 40,
  nightSurchargePct: 10,
  nightStartHourIst: 22,
  nightEndHourIst: 6,
  urgentSurchargePct: 20,
  urgentWithinHours: 24,
  gstPct: 12,
  rangeLowPct: 10,
  rangeHighPct: 10,
  roundToPaise: 10_000, // ₹100
  includes: ["Truck and driver", "Fuel"],
  excludes: ["Tolls"],
};

/** A card with no range, GST or rounding, so totals equal the subtotal. */
const flat: RateCard = { ...card, gstPct: 0, rangeLowPct: 0, rangeHighPct: 0, roundToPaise: 1 };

// 10:00 IST on 23 Nov 2026.
const now = new Date("2026-11-23T04:30:00Z");
// Two days later, 10:00 IST: neither night nor urgent.
const dayPickup = new Date("2026-11-25T04:30:00Z");

const quote = (distanceKm: number, rateCard: RateCard = card, pickupAt = dayPickup, at = now) =>
  priceQuote({ distanceKm, truckType: rateCard.truckTypeSlug, pickupAt, now: at }, rateCard);

describe("distance slabs", () => {
  it("charges a trip inside the first slab at the first rate", () => {
    expect(distanceFarePaise(80, card)).toBe(80 * 4_000);
  });

  it("charges each km at the rate of the slab it falls in (progressive)", () => {
    // 100 × ₹40 + 200 × ₹30
    expect(distanceFarePaise(300, card)).toBe(400_000 + 600_000);
  });

  it("uses the open-ended last slab beyond the final boundary", () => {
    // 100 × ₹40 + 400 × ₹30 + 150 × ₹25
    expect(distanceFarePaise(650, card)).toBe(400_000 + 1_200_000 + 375_000);
  });

  it("treats a slab boundary as inclusive", () => {
    expect(distanceFarePaise(100, card)).toBe(400_000);
    expect(distanceFarePaise(101, card)).toBe(403_000);
  });

  it("works with a single open-ended slab", () => {
    expect(distanceFarePaise(250, { kmSlabs: [{ upToKm: null, perKmPaise: 3_000 }] })).toBe(
      750_000,
    );
  });
});

describe("minimum and billed distance", () => {
  it("bills short trips at the minimum km", () => {
    const q = quote(20, flat);
    expect(q.chargeableKm).toBe(50);
    expect(q.subtotalPaise).toBe(200_000 + 50 * 4_000);
  });

  it("rounds a fractional distance up to the next whole km", () => {
    expect(quote(99.2, flat).chargeableKm).toBe(100);
    expect(quote(100, flat).chargeableKm).toBe(100);
  });

  it("adds the base fare once", () => {
    const q = quote(300, flat);
    expect(q.lines).toEqual([
      { kind: "base", amountPaise: 200_000 },
      { kind: "distance", amountPaise: 1_000_000 },
    ]);
    expect(q.subtotalPaise).toBe(1_200_000);
  });
});

describe("surcharges", () => {
  it("adds the night surcharge for a 23:00 IST pickup", () => {
    const q = quote(300, flat, new Date("2026-11-25T17:30:00Z"));
    expect(q.surcharges.night).toBe(true);
    expect(q.lines).toContainEqual({ kind: "night", amountPaise: 120_000 });
    expect(q.subtotalPaise).toBe(1_320_000);
  });

  it("handles a night window that wraps midnight (05:59 IST is night, 06:00 is not)", () => {
    expect(quote(300, flat, new Date("2026-11-25T00:29:00Z")).surcharges.night).toBe(true);
    expect(quote(300, flat, new Date("2026-11-25T00:30:00Z")).surcharges.night).toBe(false);
  });

  it("supports a night window that doesn't wrap", () => {
    const early: RateCard = { ...flat, nightStartHourIst: 0, nightEndHourIst: 5 };
    expect(quote(300, early, new Date("2026-11-24T20:30:00Z")).surcharges.night).toBe(true); // 02:00 IST
    expect(quote(300, early, new Date("2026-11-25T17:30:00Z")).surcharges.night).toBe(false); // 23:00 IST
  });

  it("adds the urgent surcharge when pickup is sooner than the urgent window", () => {
    const q = quote(300, flat, new Date(now.getTime() + 3 * 3_600_000));
    expect(q.surcharges.urgent).toBe(true);
    expect(q.lines).toContainEqual({ kind: "urgent", amountPaise: 240_000 });
  });

  it("does not treat a pickup exactly at the urgent boundary as urgent", () => {
    const q = quote(300, flat, new Date(now.getTime() + 24 * 3_600_000));
    expect(q.surcharges.urgent).toBe(false);
  });

  it("applies night and urgent to the same pre-surcharge amount (no compounding)", () => {
    const tenPmIst = new Date("2026-11-23T16:30:00Z");
    const q = quote(300, flat, tenPmIst, tenPmIst);
    expect(q.surcharges).toEqual({ night: true, urgent: true });
    expect(q.subtotalPaise).toBe(1_200_000 + 120_000 + 240_000);
  });

  it("treats a pickup in the past as now (urgent)", () => {
    const q = quote(300, flat, new Date("2026-11-20T04:30:00Z"));
    expect(q.surcharges.urgent).toBe(true);
  });

  it("skips a surcharge whose percentage is zero", () => {
    const q = quote(300, { ...flat, urgentSurchargePct: 0 }, now);
    expect(q.surcharges.urgent).toBe(true);
    expect(q.lines.map((l) => l.kind)).toEqual(["base", "distance"]);
  });
});

describe("GST, range and rounding", () => {
  it("adds GST to both ends of the range", () => {
    const q = quote(300, { ...card, rangeLowPct: 0, rangeHighPct: 0, roundToPaise: 1 });
    // ₹12,000 + 12% = ₹13,440 → min equals that, max is one unit above.
    expect(q.fare.minPaise).toBe(1_344_000);
    expect(q.gst).toEqual({ minPaise: 144_000, maxPaise: 144_000 });
  });

  it("widens by the range percentages, rounding min down and max up to ₹100", () => {
    const q = quote(300);
    // low: 12,00,000 × 0.9 × 1.12 = 12,09,600 → 12,00,000 · high: × 1.1 × 1.12 = 14,78,400 → 14,80,000
    expect(q.fare).toEqual({ minPaise: 1_200_000, maxPaise: 1_480_000 });
  });

  it("always returns a true range (min < max), even with zero spread", () => {
    const q = quote(300, { ...card, rangeLowPct: 0, rangeHighPct: 0 });
    expect(q.fare.maxPaise).toBeGreaterThan(q.fare.minPaise);
  });

  it("returns integer paise that are multiples of the rounding unit", () => {
    for (const km of [37, 101, 333.3, 777, 1_480]) {
      const { minPaise, maxPaise } = quote(km).fare;
      expect(Number.isInteger(minPaise) && Number.isInteger(maxPaise)).toBe(true);
      expect(minPaise % card.roundToPaise).toBe(0);
      expect(maxPaise % card.roundToPaise).toBe(0);
      expect(minPaise).toBeLessThan(maxPaise);
    }
  });

  it("never rises with a shorter trip (monotonic in distance)", () => {
    let previous = 0;
    for (let km = 10; km <= 1_200; km += 37) {
      const max = quote(km).fare.maxPaise;
      expect(max).toBeGreaterThanOrEqual(previous);
      previous = max;
    }
  });

  it("passes includes/excludes through without sharing the card's arrays", () => {
    const q = quote(300);
    expect(q.includes).toEqual(card.includes);
    q.includes.push("mutated");
    expect(card.includes).not.toContain("mutated");
  });
});

describe("transit time", () => {
  it("adds loading time to driving time for a same-day trip", () => {
    // 300 km at 40 km/h = 7.5 h + 2 h loading
    expect(quote(300).transitHours).toEqual({ min: 10, max: 13 });
  });

  it("adds driver rest on multi-day trips", () => {
    // 1000 km = 25 h driving → 2 rests × 8 h + 2 h loading = 43 h
    expect(quote(1_000).transitHours).toEqual({ min: 43, max: 54 });
  });
});

describe("input validation", () => {
  it("rejects a rate card for a different truck", () => {
    expect(() =>
      priceQuote({ distanceKm: 300, truckType: "container-32ft", pickupAt: dayPickup, now }, card),
    ).toThrow(/not "container-32ft"/);
  });

  it.each([0, -5, Number.NaN, Number.POSITIVE_INFINITY])("rejects distance %s", (km) => {
    expect(() => quote(km)).toThrow(RangeError);
  });

  it("rejects an invalid pickup date", () => {
    expect(() => quote(300, card, new Date("not a date"))).toThrow(RangeError);
  });
});

describe("RateCardSchema", () => {
  it("accepts the fixture", () => {
    expect(RateCardSchema.parse(card)).toEqual(card);
  });

  it("requires the last slab to be open-ended", () => {
    const result = RateCardSchema.safeParse({ ...card, kmSlabs: [{ upToKm: 100, perKmPaise: 1 }] });
    expect(result.success).toBe(false);
  });

  it("requires ascending slab boundaries", () => {
    const result = RateCardSchema.safeParse({
      ...card,
      kmSlabs: [
        { upToKm: 500, perKmPaise: 1 },
        { upToKm: 100, perKmPaise: 1 },
        { upToKm: null, perKmPaise: 1 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects fractional paise", () => {
    expect(RateCardSchema.safeParse({ ...card, baseFarePaise: 100.5 }).success).toBe(false);
  });
});
