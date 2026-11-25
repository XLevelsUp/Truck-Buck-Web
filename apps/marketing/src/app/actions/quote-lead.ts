"use server";

import { headers } from "next/headers";
import { after } from "next/server";

import { type LeadResult, QuoteLeadInputSchema } from "@truckbuck/types";
import { normalizeIndianMobile } from "@truckbuck/utils";

import { serverEnv } from "@/env.server";
import { allowRequest, clientIp, verifyTurnstile } from "@/server/abuse";
import { computeEstimate } from "@/server/estimate";
import { conversionContext } from "@/server/ga4";
import { insertLead } from "@/server/leads";
import { processNewLead } from "@/server/notify";

/** Bump when the consent sentence next to the form changes. */
const QUOTE_CONSENT_VERSION = "2026-11-quote-v2";

function reference(id: string): string {
  return `TB-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

/**
 * Saves a quote lead (type = "quote"). Order of checks: shape → honeypot →
 * phone → rate limit → Turnstile → recompute the estimate server-side (never
 * trust a fare from the browser) → insert. Unserved routes are saved too,
 * with served = false, so ops can call back.
 */
export async function submitQuoteLead(input: unknown): Promise<LeadResult> {
  const parsed = QuoteLeadInputSchema.safeParse(input);
  if (!parsed.success) {
    const fields = parsed.error.flatten().fieldErrors;
    return {
      ok: false,
      reason: "invalid",
      fieldErrors: {
        ...(fields.name?.[0] ? { name: fields.name[0] } : {}),
        ...(fields.phone?.[0] ? { phone: fields.phone[0] } : {}),
      },
    };
  }
  const lead = parsed.data;

  // Bots fill hidden fields. Answer like a success, save nothing.
  if (lead.website) return { ok: true, reference: "TB-000000", served: true };

  const phone = normalizeIndianMobile(lead.phone);
  if (!phone) {
    return {
      ok: false,
      reason: "invalid",
      fieldErrors: { phone: "Enter a 10-digit mobile number" },
    };
  }

  const requestHeaders = await headers();
  const ip = clientIp(requestHeaders);
  if (!(await allowRequest("lead", ip))) return { ok: false, reason: "rate_limited" };
  if (!(await verifyTurnstile(lead.turnstileToken, ip, "quote_lead")))
    return { ok: false, reason: "bot_check" };

  const outcome = await computeEstimate(lead.estimate);
  const estimate = outcome.ok ? outcome.estimate : null;
  const quote = estimate?.quote ?? null;

  const row = {
    type: "quote",
    name: lead.name,
    phone_e164: phone,
    pickup: estimate ? estimate.from : { placeId: lead.estimate.from },
    drop: estimate ? estimate.to : { placeId: lead.estimate.to },
    truck_type_slug: lead.estimate.truck,
    pickup_date: lead.estimate.date,
    weight_tonnes: lead.estimate.weightTonnes ?? null,
    material: lead.estimate.material ?? null,
    distance_km: estimate?.distanceKm ?? null,
    fare_min_paise: quote?.fare.minPaise ?? null,
    fare_max_paise: quote?.fare.maxPaise ?? null,
    rate_card_version: quote?.rateCardVersion ?? null,
    served: estimate?.served ?? false,
    details: outcome.ok ? {} : { estimate_error: outcome.error },
    utm: lead.utm,
    source_path: lead.sourcePath ?? null,
    referrer: lead.referrer ?? null,
    locale: lead.locale,
    consent_contact: true,
    consent_text_version: QUOTE_CONSENT_VERSION,
    is_test: quote?.sample ?? serverEnv.allowSampleData,
  };

  const saved = await insertLead(row);
  if (!saved) return { ok: false, reason: "unavailable" };
  const ref = reference(saved.id);
  const conversion = conversionContext(requestHeaders.get("cookie"));
  // Ops alerts, Sheet row, customer WhatsApp ack and GA4 conversion — after the response.
  after(() => processNewLead(saved.id, ref, row, { ack: "ack", conversion }));
  return { ok: true, reference: ref, served: row.served };
}
