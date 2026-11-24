import { z } from "zod";

const paise = z.number().int().nonnegative();
const percent = z.number().min(0).max(100);
const hourOfDay = z.number().int().min(0).max(23);

export const KmSlabSchema = z.object({
  /** Upper bound of this slab in km (inclusive). `null` = open-ended last slab. */
  upToKm: z.number().int().positive().nullable(),
  perKmPaise: paise,
});
export type KmSlab = z.infer<typeof KmSlabSchema>;

/**
 * One truck type's fare inputs, mirroring the `rate_cards` table. All money
 * is integer paise; percentages are 0–100.
 */
export const RateCardSchema = z
  .object({
    truckTypeSlug: z.string().min(1),
    version: z.string().min(1),
    baseFarePaise: paise,
    /** Trips shorter than this are charged as this many km. */
    minKm: z.number().int().nonnegative(),
    /** Progressive slabs: each km is charged at the rate of the slab it falls in. */
    kmSlabs: z.array(KmSlabSchema).min(1),
    /** Loading + unloading time added to transit estimates. */
    loadingHours: z.number().nonnegative(),
    avgSpeedKmph: z.number().positive(),
    nightSurchargePct: percent,
    /** Night window in IST, [start, end). May wrap midnight (22 → 6). */
    nightStartHourIst: hourOfDay,
    nightEndHourIst: hourOfDay,
    urgentSurchargePct: percent,
    /** Pickups sooner than this many hours from now are "urgent". 0 disables. */
    urgentWithinHours: z.number().nonnegative(),
    gstPct: percent,
    /** The range shown is subtotal −rangeLowPct … +rangeHighPct. */
    rangeLowPct: z.number().min(0).lt(100),
    rangeHighPct: z.number().min(0).max(200),
    /** Fares are shown rounded to this unit (e.g. 10000 = ₹100). */
    roundToPaise: z.number().int().positive(),
    includes: z.array(z.string()),
    excludes: z.array(z.string()),
  })
  .superRefine((card, ctx) => {
    const slabs = card.kmSlabs;
    slabs.forEach((slab, index) => {
      const isLast = index === slabs.length - 1;
      if (isLast && slab.upToKm !== null) {
        ctx.addIssue({
          code: "custom",
          path: ["kmSlabs", index, "upToKm"],
          message: "The last slab must be open-ended (upToKm: null).",
        });
      }
      if (!isLast && slab.upToKm === null) {
        ctx.addIssue({
          code: "custom",
          path: ["kmSlabs", index, "upToKm"],
          message: "Only the last slab may be open-ended.",
        });
      }
      const previous = slabs[index - 1];
      if (previous?.upToKm != null && slab.upToKm !== null && slab.upToKm <= previous.upToKm) {
        ctx.addIssue({
          code: "custom",
          path: ["kmSlabs", index, "upToKm"],
          message: "Slabs must be in ascending order of upToKm.",
        });
      }
    });
  });
export type RateCard = z.infer<typeof RateCardSchema>;
