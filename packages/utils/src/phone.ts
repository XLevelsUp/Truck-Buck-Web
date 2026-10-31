/**
 * Indian mobile numbers. Canonical form is E.164 (`+919876543210`); that is
 * what we store and send to the API. Format only for display.
 */

const E164_IN_MOBILE = /^\+91[6-9]\d{9}$/;

/**
 * Normalises user input to E.164, or returns `null` if it is not a valid
 * Indian mobile number. Accepts spaces, dashes, brackets and the common
 * prefixes: `+91`, `91`, `0091` and a leading trunk `0`.
 */
export function normalizeIndianMobile(input: string): string | null {
  const digits = input.replace(/[\s\-().]/g, "");
  const national = digits
    .replace(/^\+91(?=\d{10}$)/, "")
    .replace(/^0091(?=\d{10}$)/, "")
    .replace(/^91(?=\d{10}$)/, "")
    .replace(/^0(?=\d{10}$)/, "");
  const e164 = `+91${national}`;
  return E164_IN_MOBILE.test(e164) ? e164 : null;
}

export function isValidIndianMobile(input: string): boolean {
  return normalizeIndianMobile(input) !== null;
}

/** `+91 98765 43210`, or `null` if the input is not a valid Indian mobile. */
export function formatIndianMobile(input: string): string | null {
  const e164 = normalizeIndianMobile(input);
  if (!e164) return null;
  return `+91 ${e164.slice(3, 8)} ${e164.slice(8)}`;
}
