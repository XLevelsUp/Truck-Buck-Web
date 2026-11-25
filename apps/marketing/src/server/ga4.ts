import "server-only";

import { serverEnv } from "@/env.server";
import { consentFromCookieHeader } from "@/lib/consent";
import { log } from "@/server/log";

/**
 * Server-side conversions via the GA4 Measurement Protocol, so ad blockers
 * can't hide them. Sent ONLY when the visitor accepted analytics (tb_consent
 * cookie) and has our first-party analytics id (tb_cid, the same client_id
 * GTM's GA4 tag uses — see docs/analytics.md). No personal data: params are
 * lead type, truck, served flag and campaign fields only.
 */

export type ConversionEvent =
  | "callback_submitted"
  | "business_enquiry_submitted"
  | "transporter_submitted"
  | "driver_waitlist_submitted"
  | "contact_submitted";

export interface ConversionContext {
  consent: "granted" | "denied" | null;
  clientId: string | null;
}

/** Reads consent + analytics id from the request's Cookie header. */
export function conversionContext(cookie: string | null): ConversionContext {
  const id = cookie?.match(/(?:^|;\s*)tb_cid=(\d+\.\d+)/)?.[1] ?? null;
  return { consent: consentFromCookieHeader(cookie), clientId: id };
}

export async function sendConversion(
  context: ConversionContext,
  event: ConversionEvent,
  params: Record<string, string | number | boolean | null | undefined>,
): Promise<"sent" | "skipped" | "failed"> {
  const ga4 = serverEnv.ga4;
  if (!ga4 || context.consent !== "granted" || !context.clientId) return "skipped";
  const clean: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") {
      clean[key] = typeof value === "string" ? value.slice(0, 100) : value;
    }
  }
  try {
    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(ga4.measurementId)}&api_secret=${encodeURIComponent(ga4.apiSecret)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: context.clientId,
          non_personalized_ads: true,
          consent: { ad_user_data: "DENIED", ad_personalization: "DENIED" },
          events: [{ name: event, params: { ...clean, server_side: true } }],
        }),
        signal: AbortSignal.timeout(5_000),
      },
    );
    return response.ok ? "sent" : "failed";
  } catch (error) {
    log.error("[ga4] conversion failed", error);
    return "failed";
  }
}
