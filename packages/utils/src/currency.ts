/**
 * Money is stored and transported as integer paise (1 INR = 100 paise) to
 * avoid floating-point rounding. Convert to rupees only for display.
 */

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const inrWholeFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export interface FormatINROptions {
  /** Drop the paise part (rounds to the nearest rupee). Default: false. */
  wholeRupees?: boolean;
}

/** Formats integer paise as Indian Rupees with lakh/crore grouping: `₹1,23,456.78`. */
export function formatINR(paise: number, options: FormatINROptions = {}): string {
  assertPaise(paise);
  const rupees = paise / 100;
  return options.wholeRupees ? inrWholeFormatter.format(rupees) : inrFormatter.format(rupees);
}

/** Converts a rupee amount (e.g. from a form field) to integer paise. */
export function rupeesToPaise(rupees: number): number {
  if (!Number.isFinite(rupees)) {
    throw new RangeError(`Expected a finite rupee amount, got ${rupees}`);
  }
  return Math.round(rupees * 100);
}

function assertPaise(paise: number): void {
  if (!Number.isSafeInteger(paise)) {
    throw new RangeError(`Expected an integer amount in paise, got ${paise}`);
  }
}
