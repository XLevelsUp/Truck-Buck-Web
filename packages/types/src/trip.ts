import { z } from "zod";

import { EntityIdSchema, IsoDateTimeSchema, TenantScopedSchema } from "./common";

export const TripStatusSchema = z.enum(["scheduled", "started", "completed", "cancelled"]);

/** Indian vehicle registration, e.g. `MH12AB1234` (stored without spaces). */
export const VehicleNumberSchema = z
  .string()
  .regex(/^[A-Z]{2}\d{1,2}[A-Z]{0,3}\d{4}$/, "Expected vehicle number like MH12AB1234");

export const TripSchema = TenantScopedSchema.extend({
  id: EntityIdSchema,
  bookingId: EntityIdSchema,
  transporterId: EntityIdSchema,
  driverId: EntityIdSchema.nullable(),
  vehicleNumber: VehicleNumberSchema,
  status: TripStatusSchema,
  startedAt: IsoDateTimeSchema.nullable(),
  completedAt: IsoDateTimeSchema.nullable(),
});
export type Trip = z.infer<typeof TripSchema>;
