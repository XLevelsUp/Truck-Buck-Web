import { describe, expect, it } from "vitest";

import { gstinCheckChar, isValidGstin, normalizeGstin } from "./gstin";

describe("GSTIN", () => {
  it.each(["27AAPFU0939F1ZV", "29AAGCB7383J1Z4"])("accepts a valid GSTIN %s", (gstin) => {
    expect(isValidGstin(gstin)).toBe(true);
  });

  it("normalises case and spaces before checking", () => {
    expect(normalizeGstin(" 27aapfu0939f1zv ")).toBe("27AAPFU0939F1ZV");
    expect(isValidGstin("27aapfu 0939f1zv")).toBe(true);
  });

  it("rejects a wrong check character", () => {
    expect(isValidGstin("27AAPFU0939F1ZW")).toBe(false);
  });

  it.each([
    ["too short", "27AAPFU0939F1Z"],
    ["state code 00", "00AAPFU0939F1ZV"],
    ["missing Z", "27AAPFU0939F1XV"],
    ["PAN digits in letter slots", "2712345678901ZV"],
  ])("rejects %s", (_, gstin) => {
    expect(isValidGstin(gstin)).toBe(false);
  });

  it("computes the check character", () => {
    expect(gstinCheckChar("27AAPFU0939F1Z")).toBe("V");
  });
});
