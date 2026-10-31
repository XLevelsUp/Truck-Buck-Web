import { z } from "zod";

/**
 * Tenant identifier. Every API resource belongs to exactly one tenant; the
 * brand stops a plain string (or another id) being passed where a ClientId
 * is required.
 */
export const ClientIdSchema = z.string().min(1).brand<"ClientId">();
export type ClientId = z.infer<typeof ClientIdSchema>;

/** Base for every tenant-owned resource. Extend this, never re-declare clientId. */
export const TenantScopedSchema = z.object({
  clientId: ClientIdSchema,
});

export const EntityIdSchema = z.string().min(1);

/** Money as integer paise (₹1 = 100 paise). Never use floats for money. */
export const PaiseSchema = z.number().int().nonnegative();
export type Paise = z.infer<typeof PaiseSchema>;

/** UTC instant as an ISO-8601 string with offset, as sent by the API. */
export const IsoDateTimeSchema = z.iso.datetime({ offset: true });

/** Indian mobile number in E.164 form: `+919876543210`. */
export const IndianMobileSchema = z
  .string()
  .regex(/^\+91[6-9]\d{9}$/, "Expected +91 mobile number");

export const LocationSchema = z.object({
  label: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().regex(/^[1-9]\d{5}$/, "Expected 6-digit PIN code"),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type Location = z.infer<typeof LocationSchema>;
