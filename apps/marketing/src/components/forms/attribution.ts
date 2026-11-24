import type { Utm } from "@truckbuck/types";

const KEY = "tb_utm";
const FIELDS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
] as const;

/**
 * First-touch attribution for this visit: UTM params from the landing URL,
 * kept in sessionStorage so they survive in-page navigation. Storage can be
 * unavailable (private mode) — then the current URL is used.
 */
export function readUtm(): Utm {
  const fromUrl: Utm = {};
  const params = new URLSearchParams(window.location.search);
  for (const field of FIELDS) {
    const value = params.get(field);
    if (value) fromUrl[field] = value.slice(0, 200);
  }
  try {
    const stored = window.sessionStorage.getItem(KEY);
    if (stored) return JSON.parse(stored) as Utm;
    if (Object.keys(fromUrl).length > 0)
      window.sessionStorage.setItem(KEY, JSON.stringify(fromUrl));
  } catch {
    // Storage blocked: fall through to the URL values.
  }
  return fromUrl;
}
