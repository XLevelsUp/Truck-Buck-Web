/**
 * "Which truck do I need?" — picks the smallest suitable truck for a load.
 * Pure and catalogue-driven: it never knows about specific truck names.
 */

export type Material = "general" | "pallets" | "heavy" | "fragile" | "perishable";

export interface AdvisorTruck {
  slug: string;
  bodyType: string;
  payloadTonnes: number;
  lengthFt: number;
  widthFt: number | null;
  heightFt: number | null;
  pallets: number | null;
}

export interface AdvisorInput {
  weightTonnes: number;
  /** Load volume in cubic feet, if known. */
  volumeCft?: number | undefined;
  material: Material;
  /** Pallet count, for palletised loads, if known. */
  pallets?: number | undefined;
}

export type AdvisorResult =
  { kind: "match"; truck: AdvisorTruck } | { kind: "too_heavy" } | { kind: "none" };

/** Keep this much payload in reserve: don't fill a truck to its rated limit. */
export const PAYLOAD_HEADROOM = 1.1;
/** Share of the box volume a real load can use (stacking gaps, doors). */
export const USABLE_VOLUME = 0.8;

/**
 * Body types per material, in tiers: the advisor only falls back to a later
 * tier when nothing in an earlier one fits. Specialist bodies (reefer) are
 * never suggested for goods that don't need them.
 */
const bodyTiers: Record<Material, readonly (readonly string[])[]> = {
  perishable: [["reefer"]],
  heavy: [
    ["open", "trailer"],
    ["closed", "container"],
  ],
  fragile: [["closed", "container"]],
  pallets: [
    ["closed", "container", "pickup", "mini"],
    ["open", "trailer"],
  ],
  general: [
    ["closed", "container", "pickup", "mini"],
    ["open", "trailer"],
  ],
};

export function usableVolumeCft(truck: AdvisorTruck): number | null {
  if (truck.widthFt === null || truck.heightFt === null) return null;
  return truck.lengthFt * truck.widthFt * truck.heightFt * USABLE_VOLUME;
}

/**
 * Smallest suitable truck (by payload, then length) in the first body tier
 * that has one, carrying the weight with headroom and fitting the volume and
 * pallets when known.
 */
export function recommendTruck(
  input: AdvisorInput,
  trucks: readonly AdvisorTruck[],
): AdvisorResult {
  if (!(input.weightTonnes > 0))
    throw new RangeError("Weight must be a positive number of tonnes.");
  const tiers = bodyTiers[input.material];
  const needed = input.weightTonnes * PAYLOAD_HEADROOM;

  const fits = (truck: AdvisorTruck) => {
    if (truck.payloadTonnes < needed) return false;
    if (input.volumeCft !== undefined) {
      const volume = usableVolumeCft(truck);
      if (volume !== null && volume < input.volumeCft) return false;
    }
    return !(
      input.pallets !== undefined &&
      truck.pallets !== null &&
      truck.pallets < input.pallets
    );
  };

  for (const bodies of tiers) {
    const [best] = trucks
      .filter((truck) => bodies.includes(truck.bodyType) && fits(truck))
      .sort((a, b) => a.payloadTonnes - b.payloadTonnes || a.lengthFt - b.lengthFt);
    if (best) return { kind: "match", truck: best };
  }

  const allowed = tiers.flat();
  const heaviest = Math.max(
    0,
    ...trucks.filter((t) => allowed.includes(t.bodyType)).map((t) => t.payloadTonnes),
  );
  return heaviest > 0 && needed > heaviest ? { kind: "too_heavy" } : { kind: "none" };
}
