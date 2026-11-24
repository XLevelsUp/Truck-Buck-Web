"use server";

import { headers } from "next/headers";

import { type LeadResult, QuoteLeadInputSchema } from "@truckbuck/types";
import { normalizeIndianMobile } from "@truckbuck/utils";

import { serverEnv } from "@/env.server";
import { allowRequest, clientIp, verifyTurnstile } from "@/server/abuse";
import { computeEstimate } from "@/server/estimate";
import { getSupabase } from "@/server/supabase";

/** Bump when the consent sentence next to the form changes. */
const QUOTE_CONSENT_VERSION = "2026-11-quote-v1";

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
  if (!(await verifyTurnstile(lead.turnstileToken, ip))) return { ok: false, reason: "bot_check" };

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

  const db = getSupabase();
  if (!db) {
    if (!serverEnv.allowSampleData) return { ok: false, reason: "unavailable" };
    console.warn("[dev] Supabase not configured — lead not saved:", {
      ...row,
      phone_e164: "+91•••",
    });
    return { ok: true, reference: "TB-DEV000", served: row.served };
  }

  const { data, error } = await db.from("leads").insert(row).select("id").single<{ id: string }>();
  if (error) {
    console.error("lead insert failed", error.message);
    return { ok: false, reason: "unavailable" };
  }
  return { ok: true, reference: reference(data.id), served: row.served };
}
