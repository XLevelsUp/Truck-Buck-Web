import "server-only";

import { createHash } from "node:crypto";

import { z } from "zod";

import { serverEnv } from "@/env.server";
import type { TurnstileAction } from "@/lib/turnstile-actions";
import { log } from "@/server/log";

import { siteRpc } from "./supabase";

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
  human: { limit: 10, windowSeconds: 60 },
  vitals: { limit: 30, windowSeconds: 60 },
  clientErrors: { limit: 10, windowSeconds: 60 },
  events: { limit: 30, windowSeconds: 60 },
} as const;

const memory = new Map<string, { windowStart: number; hits: number }>();

/**
 * Fixed-window rate limit. Backed by Postgres (`site_rate_limit_hit`) so it holds
 * across serverless instances; falls back to process memory in local dev.
 * Fails open if the database is unreachable — availability over strictness
 * for a marketing site; Turnstile still guards writes.
 */
export async function allowRequest(bucket: keyof typeof limits, ip: string): Promise<boolean> {
  const { limit, windowSeconds } = limits[bucket];
  const key = `${bucket}:${ipKey(ip)}`;
  const result = await siteRpc<boolean>("site_rate_limit_hit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (result) {
    if (result.error) {
      log.error("site_rate_limit_hit failed", result.error.message);
      return true;
    }
    return result.data === true;
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

const SiteverifySchema = z.object({
  success: z.boolean(),
  action: z.string().optional(),
  hostname: z.string().optional(),
  "error-codes": z.array(z.string()).optional(),
});

/**
 * Verifies a Cloudflare Turnstile token server-side (siteverify). False when
 * the token is missing, too long, invalid or already spent, when the request
 * fails, or — with a real secret — when the token was solved for a different
 * `action` or on a hostname that isn't ours.
 */
export async function verifyTurnstile(
  token: string | undefined,
  ip: string,
  action: TurnstileAction,
): Promise<boolean> {
  const secret = serverEnv.turnstileSecretKey;
  if (!secret || !token || token.length > 2048) return false;
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({
        secret,
        response: token,
        ...(ip === "unknown" ? {} : { remoteip: ip }),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      log.error("Turnstile siteverify HTTP", response.status);
      return false;
    }
    const result = SiteverifySchema.safeParse(await response.json());
    if (!result.success || !result.data.success) return false;
    const allowed = serverEnv.turnstileHostnames;
    if (allowed === null) return true; // Cloudflare test secret (dev/preview/e2e).
    if (result.data.action !== action) {
      log.warn("Turnstile action mismatch", { expected: action, got: result.data.action });
      return false;
    }
    if (!result.data.hostname || !allowed.includes(result.data.hostname.toLowerCase())) {
      log.warn("Turnstile hostname not allowed", result.data.hostname);
      return false;
    }
    return true;
  } catch (error) {
    log.error("Turnstile verification failed", error);
    return false;
  }
}
