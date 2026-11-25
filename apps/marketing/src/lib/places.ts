/**
 * "12, Anna Salai, T. Nagar, Chennai, Tamil Nadu 600017, India" → "Chennai, Tamil Nadu".
 * Keeps the last two meaningful parts (city, state), drops PIN codes and street detail.
 */
export function coarsePlace(label: string): string {
  const parts = label
    .split(",")
    .map((part) => part.replace(/\b\d{6}\b/g, "").trim())
    .filter((part) => part && !/^india$/i.test(part) && !/\d/.test(part));
  return parts.slice(-2).join(", ").slice(0, 80);
}
