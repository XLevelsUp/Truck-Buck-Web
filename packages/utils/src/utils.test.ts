import { describe, expect, it } from "vitest";

import {
  formatDateTimeIST,
  formatIndianMobile,
  formatINR,
  normalizeIndianMobile,
  rupeesToPaise,
  startOfDayIST,
  toISTDateKey,
} from "./index";

describe("formatINR", () => {
  it("formats paise with Indian lakh/crore grouping", () => {
    expect(formatINR(12_345_678)).toBe("₹1,23,456.78");
    expect(formatINR(1_00_00_000_00)).toBe("₹1,00,00,000.00");
  });

  it("rounds to whole rupees on request", () => {
    expect(formatINR(150_050, { wholeRupees: true })).toBe("₹1,501");
  });

  it("rejects fractional paise so float bugs surface early", () => {
    expect(() => formatINR(10.5)).toThrow(RangeError);
  });

  it("converts rupees to paise without float drift", () => {
    expect(rupeesToPaise(19.99)).toBe(1999);
  });
});

describe("IST dates", () => {
  // 20:00 UTC on 31 Jan is already 1 Feb in India.
  const lateEveningUtc = "2026-01-31T20:00:00Z";

  it("uses the IST calendar day, not the machine's", () => {
    expect(toISTDateKey(lateEveningUtc)).toBe("2026-02-01");
  });

  it("finds the start of the IST day as a UTC instant", () => {
    expect(startOfDayIST(lateEveningUtc).toISOString()).toBe("2026-01-31T18:30:00.000Z");
  });

  it("formats date-times in IST", () => {
    expect(formatDateTimeIST(lateEveningUtc)).toMatch(/01 Feb 2026, 01:30 am/i);
  });
});

describe("Indian mobile numbers", () => {
  it.each(["9876543210", "+91 98765 43210", "91-98765-43210", "0091 9876543210", "09876543210"])(
    "normalises %s to E.164",
    (input) => {
      expect(normalizeIndianMobile(input)).toBe("+919876543210");
    },
  );

  it.each(["12345", "5876543210", "+1 415 555 0100", ""])("rejects %s", (input) => {
    expect(normalizeIndianMobile(input)).toBeNull();
  });

  it("formats for display", () => {
    expect(formatIndianMobile("9876543210")).toBe("+91 98765 43210");
  });
});
