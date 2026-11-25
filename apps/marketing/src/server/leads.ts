import "server-only";

import { headers } from "next/headers";

import type { LeadResult } from "@truckbuck/types";
import { normalizeIndianMobile } from "@truckbuck/utils";

import { serverEnv } from "@/env.server";
import { redact } from "@/lib/redact";
import type { TurnstileAction } from "@/lib/turnstile-actions";
import { log } from "@/server/log";

import { allowRequest, clientIp, verifyTurnstile } from "./abuse";
import { getSupabase, siteRpc } from "./supabase";

/** Bump when the consent sentence shown next to lead forms changes. */
export const LEAD_CONSENT_VERSION = "2026-11-lead-v2";

export function referenceFor(id: string): string {
  return `TB-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

type Guarded = { ok: true; phoneE164: string } | { ok: false; result: LeadResult };

/**
 * Checks every lead form runs before saving: honeypot → phone → rate limit →
 * Turnstile. A filled honeypot is answered like a success so bots learn nothing.
 */
export async function guardLead(input: {
  website?: string | undefined;
  phone: string;
  turnstileToken?: string | undefined;
  phoneError: string;
  action: TurnstileAction;
}): Promise<Guarded> {
  if (input.website)
    return { ok: false, result: { ok: true, reference: "TB-000000", served: true } };

  const phoneE164 = normalizeIndianMobile(input.phone);
  if (!phoneE164) {
    return {
      ok: false,
      result: { ok: false, reason: "invalid", fieldErrors: { phone: input.phoneError } },
    };
  }

  const ip = clientIp(await headers());
  if (!(await allowRequest("lead", ip)))
    return { ok: false, result: { ok: false, reason: "rate_limited" } };
  if (!(await verifyTurnstile(input.turnstileToken, ip, input.action))) {
    return { ok: false, result: { ok: false, reason: "bot_check" } };
  }
  return { ok: true, phoneE164 };
}

/**
 * Saves a lead through the secret-gated `site_submit_lead` function (the
 * site's key cannot touch the leads table) and returns its id. Without
 * Supabase in development, logs a redacted row and pretends.
 */
export async function insertLead(row: Record<string, unknown>): Promise<{ id: string } | null> {
  if (!getSupabase()) {
    if (!serverEnv.allowSampleData) return null;
    log.warn("[dev] Supabase not configured — lead not saved:", redact(row));
    return { id: "dev00000-0000-0000-0000-000000000000" };
  }
  const result = await siteRpc<string>("site_submit_lead", { p_lead: row });
  if (!result || result.error || !result.data) {
    log.error("lead insert failed", result?.error?.message ?? "no id");
    return null;
  }
  return { id: result.data };
}

/** Merges keys into a recent lead's `details` (async outcomes like the WhatsApp ack). */
export async function annotateLead(id: string, details: Record<string, unknown>): Promise<void> {
  const result = await siteRpc("site_annotate_lead", { p_id: id, p_details: details });
  if (result?.error) log.error("lead annotate failed", result.error.message);
}

/** Zod issues → { field: message } using the form's own copy for known fields. */
export function fieldErrorsFrom(
  fields: Record<string, string[] | undefined>,
  messages: Record<string, string>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [field, issues] of Object.entries(fields)) {
    if (issues?.length) result[field] = messages[field] ?? issues[0] ?? "Invalid";
  }
  return result;
}
