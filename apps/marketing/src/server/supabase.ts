import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { serverEnv } from "@/env.server";

let client: SupabaseClient | null | undefined;

/**
 * Server-side Supabase client using the secret key (bypasses RLS, which
 * denies everyone else). Returns null when Supabase isn't configured, so
 * callers can fall back to sample data in development.
 */
export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  client = serverEnv.supabase
    ? createClient(serverEnv.supabase.url, serverEnv.supabase.secretKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { "x-client-info": "truckbuck-marketing" } },
      })
    : null;
  return client;
}
