/**
 * Daily real-user web-vitals check (run by .github/workflows/monitoring.yml).
 * Reads p75 per metric for the last 7 days from Supabase (site_vitals_p75,
 * secret-gated) and exits 1 when mobile p75 LCP > 2.5 s, INP > 200 ms or
 * CLS > 0.1, with enough samples to mean something.
 *
 * Env: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SITE_SECRET.
 * Writes a Markdown summary to $GITHUB_STEP_SUMMARY when set.
 */
import { appendFileSync } from "node:fs";

const THRESHOLDS = { LCP: 2500, INP: 200, CLS: 0.1 };
const MIN_SAMPLES = 50;

const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SITE_SECRET } = process.env;
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !SUPABASE_SITE_SECRET) {
  console.error("SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY and SUPABASE_SITE_SECRET are required.");
  process.exit(2);
}

const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/site_vitals_p75`, {
  method: "POST",
  headers: {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ p_secret: SUPABASE_SITE_SECRET, p_days: 7 }),
});
if (!response.ok) {
  console.error(`site_vitals_p75 failed: HTTP ${response.status}`);
  process.exit(2);
}

/** @type {{ name: string; device: string; p75: number; samples: number }[]} */
const rows = await response.json();
const failures = [];
const lines = ["| Metric | Device | p75 | Samples | Threshold |", "|---|---|---|---|---|"];
for (const row of rows.sort((a, b) =>
  `${a.device}${a.name}`.localeCompare(`${b.device}${b.name}`),
)) {
  const limit = THRESHOLDS[row.name];
  const value = row.name === "CLS" ? row.p75.toFixed(3) : `${Math.round(row.p75)} ms`;
  lines.push(`| ${row.name} | ${row.device} | ${value} | ${row.samples} | ${limit ?? "–"} |`);
  if (
    limit !== undefined &&
    row.device === "mobile" &&
    row.samples >= MIN_SAMPLES &&
    row.p75 > limit
  ) {
    failures.push(`mobile p75 ${row.name} ${value} > ${limit}`);
  }
}

const summary = [
  "## Real-user web vitals (last 7 days)",
  "",
  rows.length ? lines.join("\n") : "_No samples yet._",
  "",
  failures.length
    ? `**Over budget:** ${failures.join("; ")}`
    : "All mobile p75 values within budget.",
].join("\n");
// eslint-disable-next-line no-console -- CLI output.
console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY)
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
process.exit(failures.length ? 1 : 0);
