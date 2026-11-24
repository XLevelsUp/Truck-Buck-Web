/**
 * Product claims, one switch each (NFC-11). This is the ONLY place to change
 * what the site says the product does:
 *
 *   "live"        shown as a feature
 *   "roadmap"     shown with a "Coming soon" tag
 *   "unconfirmed" visible missing-fact marker in development, hidden in production
 *
 * "live" defaults are limited to the product model itself (Phase 1 blueprint):
 * upfront fare ranges, a closed vetted network, no bidding, and the driver
 * app's positioning. Everything else waits for ops to confirm.
 */
export type FeatureStatus = "live" | "roadmap" | "unconfirmed";

export const featureStatus = {
  // Shippers
  upfrontFare: "live",
  vettedNetwork: "live",
  liveTracking: "unconfirmed",
  podPhotoSignature: "unconfirmed",
  gstInvoices: "unconfirmed",
  tripReports: "unconfirmed",
  teamAccounts: "roadmap",
  // Transporters
  steadyLoads: "unconfirmed",
  noBidding: "live",
  transparentFee: "unconfirmed",
  onTimePayment: "unconfirmed",
  driverAssignment: "unconfirmed",
  // Driver app
  driverTripDetails: "live",
  driverNavigation: "unconfirmed",
  driverPod: "unconfirmed",
  driverWhatsappUpdates: "live",
  // Booking lifecycle (/how-it-works)
  shipperRating: "unconfirmed",
  paymentStatus: "unconfirmed",
} as const satisfies Record<string, FeatureStatus>;

export type FeatureKey = keyof typeof featureStatus;

/** Whether a feature renders at all in this build. */
export function isShown(key: FeatureKey): boolean {
  return featureStatus[key] !== "unconfirmed" || process.env.NODE_ENV !== "production";
}

/** Verification timeline shown on /transporters. null = missing (NFC-5). */
export const vettingTimeline: string | null = null;
