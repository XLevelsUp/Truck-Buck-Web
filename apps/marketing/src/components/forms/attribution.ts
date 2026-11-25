import type { Utm } from "@truckbuck/types";

/**
 * First-touch attribution, attached to every lead: UTM params, landing page
 * and referrer from the visitor's FIRST visit (kept 90 days in localStorage),
 * with UTMs from a newer campaign visit taking over (last non-direct touch).
 * Stays in the browser until the visitor submits a form; it is never sent to
 * analytics. Storage can be unavailable (private mode): then the current
 * page's values are used.
 */

const KEY = "tb_attribution";
const TTL_MS = 90 * 86_400_000;
const UTM_FIELDS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
] as const;

interface Stored extends Utm {
  saved_at: number;
}

function fromUrl(): Utm {
  const utm: Utm = {};
  const params = new URLSearchParams(window.location.search);
  for (const field of UTM_FIELDS) {
    const value = params.get(field);
    if (value) utm[field] = value.slice(0, 200);
  }
  return utm;
}

/** External referrer only (our own pages are not a source). */
function externalReferrer(): string | undefined {
  if (!document.referrer) return undefined;
  try {
    const url = new URL(document.referrer);
    if (url.host === window.location.host) return undefined;
    // Origin + path only: referrer query strings can carry personal data.
    return `${url.origin}${url.pathname}`.slice(0, 300);
  } catch {
    return undefined;
  }
}

/** Call once per page load (SiteShell does); records the first touch. */
export function captureAttribution(): void {
  try {
    const now = Date.now();
    const stored = JSON.parse(window.localStorage.getItem(KEY) ?? "null") as Stored | null;
    const campaign = fromUrl();
    const fresh = !stored || now - stored.saved_at > TTL_MS;
    if (fresh) {
      const referrer = externalReferrer();
      const first: Stored = {
        ...campaign,
        landing_path: window.location.pathname.slice(0, 300),
        ...(referrer ? { first_referrer: referrer } : {}),
        first_seen_at: new Date(now).toISOString(),
        saved_at: now,
      };
      window.localStorage.setItem(KEY, JSON.stringify(first));
    } else if (Object.keys(campaign).length > 0) {
      // A new campaign click replaces the old UTMs; the landing page stays first-touch.
      const next: Stored = { ...stored, ...campaign };
      for (const field of UTM_FIELDS) if (!campaign[field]) delete next[field];
      window.localStorage.setItem(KEY, JSON.stringify(next));
    }
  } catch {
    // Storage blocked: readUtm() falls back to the current URL.
  }
}

/** Attribution for a lead: stored first touch, or this page's values. */
export function readUtm(): Utm {
  try {
    const stored = JSON.parse(window.localStorage.getItem(KEY) ?? "null") as Stored | null;
    if (stored) {
      const { saved_at: _savedAt, ...utm } = stored;
      void _savedAt;
      return utm;
    }
  } catch {
    // fall through
  }
  return { ...fromUrl(), landing_path: window.location.pathname.slice(0, 300) };
}
