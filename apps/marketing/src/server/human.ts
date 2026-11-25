import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { serverEnv } from "@/env.server";

/**
 * "Passed the bot check" cookie. One Turnstile solve (POST /api/human) earns
 * a signed, HttpOnly cookie for 30 minutes; /api/estimate requires it. This
 * keeps estimate responses cacheable by URL (no per-request token) while
 * Google Maps lookups still sit behind Turnstile.
 */
export const HUMAN_COOKIE = "tb_h";
const TTL_SECONDS = 30 * 60;

const sign = (expires: string) =>
  createHmac("sha256", `human:${serverEnv.rateLimitSalt}`).update(expires).digest("base64url");

export function humanCookieHeader(now = Date.now()): string {
  const expires = String(Math.floor(now / 1000) + TTL_SECONDS);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${HUMAN_COOKIE}=${expires}.${sign(expires)}; Max-Age=${TTL_SECONDS}; Path=/api; HttpOnly; SameSite=Strict${secure}`;
}

export function hasHumanCookie(headers: Headers, now = Date.now()): boolean {
  const cookie = headers
    .get("cookie")
    ?.split(/;\s*/)
    .find((part) => part.startsWith(`${HUMAN_COOKIE}=`))
    ?.slice(HUMAN_COOKIE.length + 1);
  if (!cookie) return false;
  const [expires, signature] = cookie.split(".");
  if (!expires || !signature || Number(expires) * 1000 < now) return false;
  const expected = Buffer.from(sign(expires));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
