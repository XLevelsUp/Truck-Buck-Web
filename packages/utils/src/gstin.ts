/**
 * Indian GSTIN (Goods and Services Tax Identification Number) checks.
 * Format: 2-digit state code · 10-char PAN · entity number · "Z" · check char.
 * The check character is the standard mod-36 checksum over the first 14.
 */

const CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const GSTIN_FORMAT = /^(0[1-9]|[1-3][0-9])[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/** Uppercases and strips spaces, so "33aaact 1234f1z5" can be checked. */
export function normalizeGstin(input: string): string {
  return input.replace(/\s+/g, "").toUpperCase();
}

export function gstinCheckChar(first14: string): string {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const product = CHARSET.indexOf(first14.charAt(i)) * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(product / 36) + (product % 36);
  }
  return CHARSET.charAt((36 - (sum % 36)) % 36);
}

/** True for a well-formed GSTIN with a valid check character. */
export function isValidGstin(input: string): boolean {
  const gstin = normalizeGstin(input);
  return GSTIN_FORMAT.test(gstin) && gstinCheckChar(gstin.slice(0, 14)) === gstin.charAt(14);
}
