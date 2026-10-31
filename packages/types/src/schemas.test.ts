import { describe, expect, it } from "vitest";

import { BookingSchema } from "./index";

const validBooking = {
  clientId: "tenant_acme",
  id: "bkg_1",
  shipperId: "shp_1",
  transporterId: null,
  pickup: {
    label: "Bhiwandi warehouse",
    city: "Bhiwandi",
    state: "Maharashtra",
    pincode: "421302",
    lat: 19.3,
    lng: 73.06,
  },
  drop: {
    label: "Chakan MIDC",
    city: "Pune",
    state: "Maharashtra",
    pincode: "410501",
    lat: 18.76,
    lng: 73.86,
  },
  truckType: "mcv",
  scheduledPickupAt: "2026-11-02T04:30:00+05:30",
  status: "requested",
  fare: 1_850_000,
  platformFee: 25_000,
  createdAt: "2026-10-31T09:00:00Z",
};

describe("BookingSchema", () => {
  it("accepts a well-formed booking", () => {
    expect(BookingSchema.parse(validBooking).clientId).toBe("tenant_acme");
  });

  it("rejects a booking without a tenant (clientId)", () => {
    const { clientId: _omit, ...withoutTenant } = validBooking;
    const result = BookingSchema.safeParse(withoutTenant);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["clientId"]);
  });

  it("rejects fractional money so amounts stay in integer paise", () => {
    expect(BookingSchema.safeParse({ ...validBooking, fare: 18_500.5 }).success).toBe(false);
  });
});
