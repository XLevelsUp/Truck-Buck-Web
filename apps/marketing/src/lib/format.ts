/**
 * Fills `{name}` slots in a content string. Whole sentences with
 * slots (not concatenation) keep copy translatable.
 */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

/** Compact number for UI: 4 → "4", 0.8 → "0.8", 1.50 → "1.5". */
export function trimNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(1)));
}
