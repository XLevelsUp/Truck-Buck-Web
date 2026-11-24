import { describe, expect, it } from "vitest";

import { type AdvisorTruck, recommendTruck, usableVolumeCft } from "./recommend-truck";

const t = (
  slug: string,
  bodyType: string,
  payloadTonnes: number,
  lengthFt: number,
  widthFt: number,
  heightFt: number,
  pallets: number,
): AdvisorTruck => ({ slug, bodyType, payloadTonnes, lengthFt, widthFt, heightFt, pallets });

const catalog = [
  t("mini", "mini", 0.8, 7, 4.5, 4, 2),
  t("lcv14", "closed", 4, 14, 6, 6, 6),
  t("mcv20", "closed", 7, 20, 7, 7, 10),
  t("cont32", "container", 15, 32, 8, 8, 16),
  t("open22", "open", 16, 22, 7.5, 3.5, 12),
  t("reefer20", "reefer", 6, 20, 7, 6.5, 10),
];

const pick = (input: Parameters<typeof recommendTruck>[0]) => {
  const result = recommendTruck(input, catalog);
  return result.kind === "match" ? result.truck.slug : result.kind;
};

describe("recommendTruck", () => {
  it("picks the smallest truck that carries the weight with 10% headroom", () => {
    expect(pick({ weightTonnes: 0.5, material: "general" })).toBe("mini");
    expect(pick({ weightTonnes: 3, material: "general" })).toBe("lcv14");
    // 3.7 t × 1.1 = 4.07 t > 4 t, so the 14 ft is too small.
    expect(pick({ weightTonnes: 3.7, material: "general" })).toBe("mcv20");
  });

  it("sends perishables to a reefer only", () => {
    expect(pick({ weightTonnes: 2, material: "perishable" })).toBe("reefer20");
    expect(pick({ weightTonnes: 8, material: "perishable" })).toBe("too_heavy");
  });

  it("sends heavy goods to an open body", () => {
    expect(pick({ weightTonnes: 12, material: "heavy" })).toBe("open22");
  });

  it("keeps fragile goods in closed bodies", () => {
    expect(pick({ weightTonnes: 0.5, material: "fragile" })).toBe("lcv14");
  });

  it("respects volume when given", () => {
    // lcv14 usable volume = 14 × 6 × 6 × 0.8 = 403.2 cft
    expect(usableVolumeCft(catalog[1] as AdvisorTruck)).toBeCloseTo(403.2);
    expect(pick({ weightTonnes: 1, volumeCft: 400, material: "general" })).toBe("lcv14");
    expect(pick({ weightTonnes: 1, volumeCft: 450, material: "general" })).toBe("mcv20");
  });

  it("respects pallet count for palletised loads", () => {
    expect(pick({ weightTonnes: 2, material: "pallets", pallets: 8 })).toBe("mcv20");
  });

  it("says too heavy when no suitable truck can carry it", () => {
    expect(pick({ weightTonnes: 40, material: "general" })).toBe("too_heavy");
  });

  it("says none when nothing fits for a reason other than weight", () => {
    expect(pick({ weightTonnes: 1, volumeCft: 100_000, material: "general" })).toBe("none");
  });

  it("rejects a non-positive weight", () => {
    expect(() => recommendTruck({ weightTonnes: 0, material: "general" }, catalog)).toThrow(
      RangeError,
    );
  });
});
