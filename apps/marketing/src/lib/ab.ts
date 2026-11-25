/*
 * A/B tests ("feature flags"), English pages only.
 *
 * How it works (no flicker, pages stay static):
 *   1. src/proxy.ts gives each human visitor a sticky assignment cookie
 *      (`tb_exp`, 90 days) for the experiments switched on in
 *      NEXT_PUBLIC_EXPERIMENTS (comma-separated keys below).
 *   2. It rewrites "/", "/shippers" and "/transporters" to the prerendered
 *      variant page /x/<page>/<code> — the URL in the address bar doesn't change.
 *   3. The page reports `experiment_viewed {experiment, variant}` (after
 *      analytics consent); GA4 compares conversions per variant.
 * Crawlers, previews and test browsers get the control. Switching an
 * experiment off sends everyone back to its control. QA: add
 * `?exp=hero:b,cta:book_truck` to force variants for the browser session
 * (session cookie `tb_exp_qa`; works even with the experiment off).
 */

export const experiments = {
  /** Hero headline + sub + CTA copy (home, shippers, transporters). */
  hero: ["a", "b", "c"],
  /** Fare widget button: "Get price" vs "Book a truck". */
  cta: ["get_price", "book_truck"],
  /** Fare widget order: route fields first vs truck type first. */
  widget_order: ["route_first", "truck_first"],
  /** After the fare: callback form first vs WhatsApp first. */
  primary_action: ["callback", "whatsapp"],
} as const;

export type ExperimentKey = keyof typeof experiments;
export type Assignment = { [K in ExperimentKey]: (typeof experiments)[K][number] };

export const CONTROL: Assignment = {
  hero: "a",
  cta: "get_price",
  widget_order: "route_first",
  primary_action: "callback",
};

export const EXPERIMENT_COOKIE = "tb_exp";
export const experimentPages = ["home", "shippers", "transporters"] as const;
export type ExperimentPage = (typeof experimentPages)[number];
export const experimentPaths: Record<string, ExperimentPage> = {
  "/": "home",
  "/shippers": "shippers",
  "/transporters": "transporters",
};

const keys = Object.keys(experiments) as ExperimentKey[];

/** Keys switched on in NEXT_PUBLIC_EXPERIMENTS. */
export function enabledExperiments(value: string | undefined): ExperimentKey[] {
  const wanted = new Set((value ?? "").split(",").map((k) => k.trim()));
  return keys.filter((key) => wanted.has(key));
}

/**
 * "hero:b,cta:book_truck" (the ?exp= form) or "hero.b~cta.book_truck" (the
 * cookie form) → partial assignment; unknown keys/variants are ignored.
 */
export function parseAssignment(value: string | null | undefined): Partial<Assignment> {
  const out: Partial<Record<ExperimentKey, string>> = {};
  for (const pair of (value ?? "").split(/[,~]/)) {
    const [key, variant] = pair.split(/[:.]/) as [ExperimentKey, string];
    if (keys.includes(key) && (experiments[key] as readonly string[]).includes(variant)) {
      out[key] = variant;
    }
  }
  return out as Partial<Assignment>;
}

/** Cookie form: only characters that never need URL-encoding. */
export const serializeAssignment = (assignment: Partial<Assignment>) =>
  Object.entries(assignment)
    .map(([key, variant]) => `${key}.${variant}`)
    .join("~");

/** Path-safe code for a full assignment: hero-cta-order-primary indexes, e.g. "1-0-1-0". */
export function encodeAssignment(assignment: Assignment): string {
  return keys
    .map((key) => (experiments[key] as readonly string[]).indexOf(assignment[key]))
    .join("-");
}

export function decodeAssignment(code: string): Assignment | null {
  const parts = code.split("-").map(Number);
  if (parts.length !== keys.length) return null;
  const out: Partial<Record<ExperimentKey, string>> = {};
  for (const [i, key] of keys.entries()) {
    const variant = (experiments[key] as readonly string[])[parts[i]!];
    if (variant === undefined) return null;
    out[key] = variant;
  }
  return out as Assignment;
}

/** Every full assignment (for prerendering the variant pages). */
export function allAssignments(): Assignment[] {
  let combos: Partial<Assignment>[] = [{}];
  for (const key of keys) {
    combos = combos.flatMap((combo) =>
      experiments[key].map((variant) => ({ ...combo, [key]: variant })),
    );
  }
  return combos as Assignment[];
}
