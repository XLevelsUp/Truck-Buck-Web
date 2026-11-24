import "server-only";

import { headers } from "next/headers";

import type { LeadResult } from "@truckbuck/types";
import { normalizeIndianMobile } from "@truckbuck/utils";

import { serverEnv } from "@/env.server";

import { allowRequest, clientIp, verifyTurnstile } from "./abuse";
import { getSupabase } from "./supabase";

/** Bump when the consent sentence shown next to lead forms changes. */
export const LEAD_CONSENT_VERSION = "2026-11-lead-v1";

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
  if (!(await verifyTurnstile(input.turnstileToken, ip))) {
    return { ok: false, result: { ok: false, reason: "bot_check" } };
  }
  return { ok: true, phoneE164 };
}

/**
 * Inserts a lead with the secret key (RLS denies everyone else) and returns
 * its id. Without Supabase in development, logs the row and pretends.
 */
export async function insertLead(row: Record<string, unknown>): Promise<{ id: string } | null> {
  const db = getSupabase();
  if (!db) {
    if (!serverEnv.allowSampleData) return null;
    console.warn("[dev] Supabase not configured — lead not saved:", {
      ...row,
      phone_e164: "+91•••",
    });
    return { id: "dev00000-0000-0000-0000-000000000000" };
  }
  const { data, error } = await db.from("leads").insert(row).select("id").single<{ id: string }>();
  if (error) {
    console.error("lead insert failed", error.message);
    return null;
  }
  return data;
}

/** Merges keys into a lead's `details` (used to record async outcomes like the WhatsApp ack). */
export async function annotateLead(id: string, details: Record<string, unknown>): Promise<void> {
  const db = getSupabase();
  if (!db) return;
  const { data } = await db
    .from("leads")
    .select("details")
    .eq("id", id)
    .single<{ details: Record<string, unknown> }>();
  await db
    .from("leads")
    .update({ details: { ...(data?.details ?? {}), ...details } })
    .eq("id", id);
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
