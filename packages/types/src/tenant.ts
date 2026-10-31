import { z } from "zod";

import { ClientIdSchema, IsoDateTimeSchema } from "./common";

export const TenantStatusSchema = z.enum(["active", "suspended"]);

export const TenantSchema = z.object({
  clientId: ClientIdSchema,
  name: z.string().min(1),
  status: TenantStatusSchema,
  createdAt: IsoDateTimeSchema,
});
export type Tenant = z.infer<typeof TenantSchema>;
