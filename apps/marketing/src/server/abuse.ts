import "server-only";

import { createHash } from "node:crypto";

import { serverEnv } from "@/env.server";

import { getSupabase } from "./supabase";

/** Client IP from the proxy headers Vercel (and most hosts) set. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "unknown";
}

/** Salted hash: we rate-limit per IP without storing IPs. */
function ipKey(ip: string): string {
  return createHash("sha256").update(`${serverEnv.rateLimitSalt}:${ip}`).digest("hex").slice(0, 32);
}

export const limits = {
  places: { limit: 120, windowSeconds: 60 },
  estimate: { limit: 20, windowSeconds: 60 },
  map: { limit: 30, windowSeconds: 60 },
  lead: { limit: 5, windowSeconds: 600 },
} as const;

const memory = new Map<string, { windowStart: number; hits: number }>();

/**
 * Fixed-window rate limit. Backed by Postgres (`rate_limit_hit`) so it holds
 * across serverless instances; falls back to process memory in local dev.
 * Fails open if the database is unreachable — availability over strictness
 * for a marketing site; Turnstile still guards writes.
 */
export async function allowRequest(bucket: keyof typeof limits, ip: string): Promise<boolean> {
  const { limit, windowSeconds } = limits[bucket];
  const key = `${bucket}:${ipKey(ip)}`;
  const db = getSupabase();

  if (db) {
    const { data, error } = (await db.rpc("rate_limit_hit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    })) as { data: boolean | null; error: { message: string } | null };
    if (error) {
      console.error("rate_limit_hit failed", error.message);
      return true;
    }
    return data === true;
  }

  const now = Date.now();
  const windowStart = Math.floor(now / (windowSeconds * 1000));
  const entry = memory.get(key);
  if (!entry || entry.windowStart !== windowStart) {
    memory.set(key, { windowStart, hits: 1 });
    return true;
  }
  entry.hits += 1;
  return entry.hits <= limit;
}

/** Verifies a Cloudflare Turnstile token. False when missing, invalid or unverifiable. */
export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = serverEnv.turnstileSecretKey;
  if (!secret) return false;
  if (!token) return false;
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(5_000),
    });
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch (error) {
    console.error("Turnstile verification failed", error);
    return false;
  }
}
