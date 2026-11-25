"use client";

/**
 * Analytics: typed events → Google Tag Manager's dataLayer, ONLY after the
 * visitor accepts analytics cookies. Before a choice, events wait in memory
 * for the current page; on "Reject" they are dropped. See docs/analytics.md.
 *
 * No personal data: every event's parameters are allow-listed below, and any
 * string that looks like a phone number or email is dropped before it leaves.
 * Names, phones and addresses never appear in the taxonomy.
 */

import { type ConsentState, getConsent, onConsentChange } from "./consent";

/* ------------------------------------------------------------------------ */
/* Taxonomy                                                                 */
/* ------------------------------------------------------------------------ */

export interface AnalyticsEvents {
  page_view: { page_path: string; page_title?: string; language: string };
  estimate_started: { page: string };
  estimate_address_entered: { field: "pickup" | "drop"; method: "search" | "location" | "link" };
  estimate_truck_selected: { truck: string };
  estimate_shown: {
    distance_km: number;
    truck: string;
    fare_min: number | null;
    fare_max: number | null;
    served: boolean;
  };
  estimate_failed: { reason: string; truck?: string };
  callback_submitted: { truck: string; served: boolean };
  whatsapp_clicked: { page: string; placement: string };
  call_clicked: { page: string; placement: string };
  business_enquiry_submitted: { monthly_trips?: string };
  transporter_step_completed: { step: number };
  transporter_submitted: { fleet_size?: string };
  driver_waitlist_submitted: Record<string, never>;
  app_badge_clicked: { page: string; store: "google_play" };
  language_switched: { from: string; to: string };
  experiment_viewed: { experiment: string; variant: string };
  exit_prompt_shown: { page: string };
  exit_prompt_clicked: { page: string };
}

export type AnalyticsEvent = keyof AnalyticsEvents;

/** Parameter keys each event may carry; anything else is stripped. */
const ALLOWED: { [E in AnalyticsEvent]: readonly (keyof AnalyticsEvents[E])[] } = {
  page_view: ["page_path", "page_title", "language"],
  estimate_started: ["page"],
  estimate_address_entered: ["field", "method"],
  estimate_truck_selected: ["truck"],
  estimate_shown: ["distance_km", "truck", "fare_min", "fare_max", "served"],
  estimate_failed: ["reason", "truck"],
  callback_submitted: ["truck", "served"],
  whatsapp_clicked: ["page", "placement"],
  call_clicked: ["page", "placement"],
  business_enquiry_submitted: ["monthly_trips"],
  transporter_step_completed: ["step"],
  transporter_submitted: ["fleet_size"],
  driver_waitlist_submitted: [],
  app_badge_clicked: ["page", "store"],
  language_switched: ["from", "to"],
  experiment_viewed: ["experiment", "variant"],
  exit_prompt_shown: ["page"],
  exit_prompt_clicked: ["page"],
};

const PHONE = /(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/;
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;

/** Allow-listed params only; strings that look like a phone or email are dropped. */
export function sanitize<E extends AnalyticsEvent>(
  event: E,
  params: AnalyticsEvents[E],
): Record<string, string | number | boolean | null> {
  const out: Record<string, string | number | boolean | null> = {};
  for (const key of ALLOWED[event] as readonly string[]) {
    const value = (params as Record<string, unknown>)[key];
    if (value === undefined) continue;
    if (typeof value === "string") {
      if (PHONE.test(value) || EMAIL.test(value)) continue;
      out[key] = value.slice(0, 100);
    } else if (typeof value === "number" || typeof value === "boolean" || value === null) {
      out[key] = value;
    }
  }
  return out;
}

/* ------------------------------------------------------------------------ */
/* dataLayer + GTM                                                          */
/* ------------------------------------------------------------------------ */

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

let pending: Record<string, unknown>[] = [];
let gtmLoaded = false;

function push(entry: Record<string, unknown>) {
  window.dataLayer ??= [];
  window.dataLayer.push(entry);
}

/** Sends an event (after consent), or holds it until the visitor chooses. */
export function track<E extends AnalyticsEvent>(event: E, params: AnalyticsEvents[E]): void {
  if (typeof window === "undefined") return;
  const entry = { event, ...sanitize(event, params) };
  const consent = getConsent();
  if (consent === "granted") push(entry);
  else if (consent === null && pending.length < 50) pending.push(entry);
}

/** Current page path for event params: no query string (it can carry ids). */
export const currentPage = () => (typeof window === "undefined" ? "" : window.location.pathname);

const CID_COOKIE = "tb_cid";

/** First-party analytics id (only created after consent); shared with GA4 and server events. */
function clientId(): string {
  const match = document.cookie.match(/(?:^|;\s*)tb_cid=([\w.]+)/);
  if (match?.[1]) return match[1];
  const id = `${Math.floor(Math.random() * 2 ** 31)}.${Math.floor(Date.now() / 1000)}`;
  document.cookie = `${CID_COOKIE}=${id}; Max-Age=${60 * 60 * 24 * 395}; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  return id;
}

function clearClientId() {
  document.cookie = `${CID_COOKIE}=; Max-Age=0; Path=/`;
}

/** Loads the GTM container once, after consent. */
function loadGtm(gtmId: string) {
  if (gtmLoaded) return;
  gtmLoaded = true;
  // Consent Mode v2: analytics granted (the visitor accepted), ads stay denied.
  function gtag(...args: unknown[]) {
    window.dataLayer ??= [];
    // gtag() must push the Arguments object itself.
    // eslint-disable-next-line prefer-rest-params -- required by Google's consent API.
    window.dataLayer.push(arguments);
    void args;
  }
  gtag("consent", "default", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  push({ tb_cid: clientId() });
  push({ "gtm.start": Date.now(), event: "gtm.js" });
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`;
  document.head.append(script);
}

/**
 * Wires consent to GTM: loads it now if already granted, or when the visitor
 * accepts; flushes or drops events queued before the choice.
 */
export function initAnalytics(gtmId: string | null): () => void {
  const apply = (state: ConsentState | null) => {
    if (state === "granted") {
      if (gtmId) loadGtm(gtmId);
      else clientId();
      for (const entry of pending) push(entry);
      pending = [];
    } else if (state === "denied") {
      pending = [];
      clearClientId();
    }
  };
  apply(getConsent());
  return onConsentChange(apply);
}
