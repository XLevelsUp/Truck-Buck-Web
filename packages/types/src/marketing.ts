import { z } from "zod";

/**
 * Contracts for the public fare estimate and lead capture. Shared so the
 * future web app (`/book`) can accept the same payloads and URLs.
 */

/** A Google place id, or `sample:<slug>` from the offline sample provider. */
export const PlaceIdSchema = z
  .string()
  .min(1)
  .max(512)
  .regex(/^[\w:.-]+$/, "Invalid place id");

export const TruckSlugSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Invalid truck type");

/** Calendar date `YYYY-MM-DD` (IST). */
export const IsoDateSchema = z.iso.date();

export const EstimateRequestSchema = z
  .object({
    from: PlaceIdSchema,
    to: PlaceIdSchema,
    truck: TruckSlugSchema,
    date: IsoDateSchema,
    weightTonnes: z.number().positive().max(60).optional(),
    material: z.string().trim().max(80).optional(),
  })
  .refine((value) => value.from !== value.to, {
    path: ["to"],
    message: "Pickup and drop must be different places",
  });
export type EstimateRequest = z.infer<typeof EstimateRequestSchema>;

export interface EstimatePlace {
  placeId: string;
  label: string;
  lat: number;
  lng: number;
}

/** What the browser gets back. Never contains rate-card internals. */
export interface EstimateResponse {
  from: EstimatePlace;
  to: EstimatePlace;
  truck: { slug: string; name: string };
  date: string;
  distanceKm: number;
  /** Is the route inside our service areas? */
  served: boolean;
  /** Null when not served or when no approved rate card exists yet. */
  quote: {
    fare: { minPaise: number; maxPaise: number };
    transitHours: { min: number; max: number };
    gstPct: number;
    includes: string[];
    excludes: string[];
    surcharges: { night: boolean; urgent: boolean };
    rateCardVersion: string;
    /** True when priced from sample data — dev/preview only. */
    sample: boolean;
  } | null;
  /** Static route preview, or null when maps aren't configured. */
  mapUrl: string | null;
}

export const UtmSchema = z
  .object({
    utm_source: z.string().max(200),
    utm_medium: z.string().max(200),
    utm_campaign: z.string().max(200),
    utm_content: z.string().max(200),
    utm_term: z.string().max(200),
    gclid: z.string().max(200),
  })
  .partial();
export type Utm = z.infer<typeof UtmSchema>;

/**
 * The quote lead form. `phone` is raw user input; servers normalise it with
 * `normalizeIndianMobile` (@truckbuck/utils). `website` is a honeypot.
 */
export const QuoteLeadInputSchema = z.object({
  estimate: EstimateRequestSchema,
  name: z.string().trim().min(2, "Enter your name").max(120),
  phone: z.string().trim().min(10, "Enter a 10-digit mobile number").max(20),
  utm: UtmSchema.default({}),
  sourcePath: z.string().max(300).optional(),
  referrer: z.string().max(500).optional(),
  turnstileToken: z.string().max(2048).optional(),
  website: z.string().max(0).optional(),
  locale: z.enum(["en", "hi", "ta"]).default("en"),
});
export type QuoteLeadInput = z.infer<typeof QuoteLeadInputSchema>;

export type LeadResult =
  | { ok: true; reference: string; served: boolean }
  | {
      ok: false;
      reason: "invalid" | "rate_limited" | "bot_check" | "unavailable";
      /** Field name → message, for the fields that failed validation. */
      fieldErrors?: Partial<Record<string, string>>;
    };

/* -------------------------------------------------------------------------- */
/* Audience lead forms (Phase 4). Shared fields + one schema per form.        */
/* -------------------------------------------------------------------------- */

export const LeadLocaleSchema = z.enum(["en", "hi", "ta"]);

const leadBase = {
  name: z.string().trim().min(2).max(120),
  /** Raw input; servers normalise with normalizeIndianMobile. */
  phone: z.string().trim().min(10).max(20),
  utm: UtmSchema.default({}),
  sourcePath: z.string().max(300).optional(),
  referrer: z.string().max(500).optional(),
  turnstileToken: z.string().max(2048).optional(),
  /** Honeypot: must stay empty. */
  website: z.string().max(0).optional(),
  locale: LeadLocaleSchema.default("en"),
};

export const FleetSizeSchema = z.enum(["1", "2-5", "6-10", "10+"]);

export const TransporterLeadInputSchema = z.object({
  ...leadBase,
  city: z.string().trim().min(2).max(80),
  fleetSize: FleetSizeSchema,
  truckTypes: z.array(TruckSlugSchema).min(1).max(12),
  homeBase: z.string().trim().min(2).max(120),
  lanes: z.string().trim().max(500).optional(),
});
export type TransporterLeadInput = z.infer<typeof TransporterLeadInputSchema>;

export const MonthlyTripsSchema = z.enum(["1-5", "6-20", "21-50", "50+"]);

export const BusinessLeadInputSchema = z.object({
  ...leadBase,
  company: z.string().trim().min(2).max(120),
  /** Format is checked here; the checksum on the server (isValidGstin). Optional. */
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[0-9]{2}[A-Z0-9]{13}$/)
    .optional()
    .or(z.literal("")),
  monthlyTrips: MonthlyTripsSchema,
  lanes: z.string().trim().min(3).max(500),
  email: z.email().max(200).optional().or(z.literal("")),
});
export type BusinessLeadInput = z.infer<typeof BusinessLeadInputSchema>;

export const DriverWaitlistInputSchema = z.object({
  ...leadBase,
  city: z.string().trim().min(2).max(80),
  transporter: z.string().trim().max(120).optional(),
});
export type DriverWaitlistInput = z.infer<typeof DriverWaitlistInputSchema>;

/* -------------------------------------------------------------------------- */
/* Support forms (Phase 6): /contact and /grievance.                          */
/* -------------------------------------------------------------------------- */

export const ContactTopicSchema = z.enum(["shipper", "transporter", "press", "other"]);

export const ContactLeadInputSchema = z.object({
  ...leadBase,
  topic: ContactTopicSchema,
  message: z.string().trim().min(10).max(2000),
  email: z.email().max(200).optional().or(z.literal("")),
  company: z.string().trim().max(120).optional(),
});
export type ContactLeadInput = z.infer<typeof ContactLeadInputSchema>;

/** DPDP Act rights requests and complaints. "erasure" is stored as an account_deletion lead. */
export const GrievanceKindSchema = z.enum(["complaint", "access", "correction", "erasure"]);

export const GrievanceLeadInputSchema = z.object({
  ...leadBase,
  kind: GrievanceKindSchema,
  message: z.string().trim().min(10).max(2000),
  email: z.email().max(200).optional().or(z.literal("")),
  /** Booking or lead reference, if the person has one. */
  reference: z.string().trim().max(40).optional(),
});
export type GrievanceLeadInput = z.infer<typeof GrievanceLeadInputSchema>;
