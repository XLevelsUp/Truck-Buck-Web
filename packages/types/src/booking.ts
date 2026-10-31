import { z } from "zod";

import {
  EntityIdSchema,
  IsoDateTimeSchema,
  LocationSchema,
  PaiseSchema,
  TenantScopedSchema,
} from "./common";

export const TruckTypeSchema = z.enum(["mini", "lcv", "mcv", "hcv", "trailer", "container"]);

export const BookingStatusSchema = z.enum([
  "requested",
  "accepted",
  "assigned",
  "in_transit",
  "delivered",
  "cancelled",
  "disputed",
]);
export type BookingStatus = z.infer<typeof BookingStatusSchema>;

export const BookingSchema = TenantScopedSchema.extend({
  id: EntityIdSchema,
  shipperId: EntityIdSchema,
  transporterId: EntityIdSchema.nullable(),
  pickup: LocationSchema,
  drop: LocationSchema,
  truckType: TruckTypeSchema,
  scheduledPickupAt: IsoDateTimeSchema,
  status: BookingStatusSchema,
  fare: PaiseSchema,
  platformFee: PaiseSchema,
  createdAt: IsoDateTimeSchema,
});
export type Booking = z.infer<typeof BookingSchema>;
