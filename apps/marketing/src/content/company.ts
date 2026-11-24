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
