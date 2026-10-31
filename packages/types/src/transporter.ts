import { z } from "zod";

import {
  EntityIdSchema,
  IndianMobileSchema,
  IsoDateTimeSchema,
  TenantScopedSchema,
} from "./common";

/** Closed network: transporters are vetted before they can accept bookings. */
export const VettingStatusSchema = z.enum(["pending", "approved", "rejected", "suspended"]);

export const TransporterSchema = TenantScopedSchema.extend({
  id: EntityIdSchema,
  name: z.string().min(1),
  contactPhone: IndianMobileSchema,
  vettingStatus: VettingStatusSchema,
  fleetSize: z.number().int().nonnegative(),
  createdAt: IsoDateTimeSchema,
});
export type Transporter = z.infer<typeof TransporterSchema>;
