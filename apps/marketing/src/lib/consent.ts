/**
 * Analytics consent, stored in a first-party cookie (`tb_consent`, 180 days)
 * so the server can read it too (server-side conversion events are sent only
 * when it is "granted"). Strictly necessary cookies (bot check, language)
 * don't depend on it.
 */

export type ConsentState = "granted" | "denied";

export const CONSENT_COOKIE = "tb_consent";
const MAX_AGE = 60 * 60 * 24 * 180;

type Listener = (state: ConsentState | null) => void;
const listeners = new Set<Listener>();

export function getConsent(): ConsentState | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)tb_consent=(granted|denied)/);
  return (match?.[1] as ConsentState | undefined) ?? null;
}

export function setConsent(state: ConsentState): void {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${state}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`;
  listeners.forEach((listener) => listener(state));
}

/** Clears the choice so the banner shows again ("Cookie settings" in the footer). */
export function resetConsent(): void {
  document.cookie = `${CONSENT_COOKIE}=; Max-Age=0; Path=/`;
  listeners.forEach((listener) => listener(null));
}

export function onConsentChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Server side: the consent recorded in a request's cookies. */
export function consentFromCookieHeader(cookie: string | null): ConsentState | null {
  const match = cookie?.match(/(?:^|;\s*)tb_consent=(granted|denied)/);
  return (match?.[1] as ConsentState | undefined) ?? null;
}
