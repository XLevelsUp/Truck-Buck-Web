/**
 * Company facts and the claims we are allowed to make. `null` = not supplied
 * yet (see NEEDS-FROM-CLIENT in docs/blueprint.md). Missing facts render as a
 * visible missing-fact marker in development and are omitted in production — never guessed.
 */
export const company = {
  /** NFC-4 */
  legalName: null as string | null,
  cin: null as string | null,
  gstin: null as string | null,
  registeredAddress: null as string | null,
  /** NFC-6 — E.164, e.g. +919876543210 */
  supportPhone: null as string | null,
  supportEmail: null as string | null,
  /** NFC-12 — e.g. "8 am – 8 pm, Mon–Sat" */
  supportHours: null as string | null,
  /**
   * Callback promise shown on the lead button. 15 comes from the Phase 3
   * brief; confirm with ops (NFC-12). Set to null to show "Request a callback".
   */
  callbackMinutes: 15 as number | null,
  /** NFC-14 */
  social: [] as { label: string; href: string }[],
  /** NFC-4 — four-digit year, e.g. 2024 */
  foundedYear: null as number | null,
  /** NFC-23 — Udyam registration number and DPIIT recognition number, if any. */
  registrations: {
    msmeUdyam: null as string | null,
    dpiitStartup: null as string | null,
  },
  /** NFC-6 — separate lines for each audience (E.164 phone, email). */
  contactLines: {
    shippers: { phone: null as string | null, email: null as string | null },
    transporters: { phone: null as string | null, email: null as string | null },
    press: { phone: null as string | null, email: null as string | null },
  },
  /** NFC-19 — Grievance Officer under the DPDP Act and IT Rules. */
  grievanceOfficer: null as {
    name: string;
    designation: string;
    email: string;
    phone: string | null;
  } | null,
  /** NFC-19 — days to acknowledge and to resolve a grievance, as approved by counsel. */
  grievanceTimelines: {
    acknowledgeDays: null as number | null,
    resolveDays: null as number | null,
  },
  /** NFC-19 — how long enquiries that never became a booking are kept, in months. */
  leadRetentionMonths: null as number | null,
  /** NFC-19 — city whose courts have jurisdiction under the terms. */
  jurisdictionCity: null as string | null,
  /** NFC-11 — working days to refund a cancelled or undelivered booking. */
  refundDays: null as number | null,
  /** NFC-19 — counsel's sign-off on the legal pages. Until then they carry a DRAFT banner. */
  legalReview: { approved: false, reviewer: null as string | null, date: null as string | null },
  /** NFC-18 — why TruckBuck exists, in the founders' words (one or two short paragraphs). */
  story: null as string | null,
  /** NFC-18 — city the company started in, only if it is true and they want it said. */
  homeRegion: null as string | null,
  /** NFC-18 — people shown on /about. photoUrl null = initials avatar. */
  team: [] as { name: string; role: string; photoUrl: string | null; photoAlt: string | null }[],
  /** NFC-5 — rating below which a transporter is suspended automatically (out of 5). */
  suspendBelowRating: null as number | null,
  /**
   * NFC-11 — claims. Only `true` claims appear on the site. "vettedTransporters"
   * is the product model itself (closed network), so it is on.
   */
  claims: {
    vettedTransporters: true,
    kycVerifiedDrivers: false,
    podEveryTrip: false,
    tripStatusUpdates: false,
    gstInvoice: false,
  },
} as const;

/** GST registration is claimed only when a GSTIN is on record. */
export const isGstRegistered = () => company.gstin !== null;
