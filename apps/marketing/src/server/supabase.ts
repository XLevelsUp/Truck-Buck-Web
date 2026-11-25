import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { serverEnv } from "@/env.server";

let client: SupabaseClient | null | undefined;

/**
 * Server-side Supabase client with the PUBLISHABLE key: RLS lets it read
 * public content only (see SECURITY.md). Writes go through `siteRpc`.
 * Returns null when Supabase isn't configured, so callers can fall back to
 * sample data in development.
 */
export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  client = serverEnv.supabase
    ? createClient(serverEnv.supabase.url, serverEnv.supabase.publishableKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { "x-client-info": "truckbuck-marketing" } },
      })
    : null;
  return client;
}

type SiteFunction =
  | "site_submit_lead"
  | "site_annotate_lead"
  | "site_rate_limit_hit"
  | "site_distance_get"
  | "site_distance_put"
  | "site_record_vitals"
  | "site_record_estimate"
  | "site_weekly_summary";

/**
 * Calls one of the secret-gated site_* database functions — the site's only
 * write path (leads, rate limits, distance cache, web vitals). Null when
 * Supabase isn't configured.
 */
export async function siteRpc<T>(
  fn: SiteFunction,
  args: Record<string, unknown>,
): Promise<{ data: T | null; error: { message: string } | null } | null> {
  const db = getSupabase();
  if (!db || !serverEnv.supabase) return null;
  const { data, error } = (await db.rpc(fn, {
    p_secret: serverEnv.supabase.siteSecret,
    ...args,
  })) as { data: unknown; error: { message: string } | null };
  return { data: (data ?? null) as T | null, error };
}
