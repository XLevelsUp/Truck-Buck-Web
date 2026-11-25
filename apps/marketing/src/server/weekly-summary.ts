import "server-only";

import { z } from "zod";

import { themes } from "@truckbuck/ui/tokens";

import { serverEnv } from "@/env.server";

import { escapeHtml, sendEmail } from "./email";
import { siteRpc } from "./supabase";

/**
 * The weekly client email: estimates, leads by type, estimate → quote-lead
 * conversion, top lanes, top sources and unserved demand. Aggregates only —
 * the database function returns counts, never lead contact details.
 */

const LaneSchema = z.object({ from_place: z.string(), to_place: z.string() });
export const SummarySchema = z.object({
  from: z.string(),
  to: z.string(),
  estimates_shown: z.number(),
  estimates_failed: z.number(),
  estimates_unserved: z.number(),
  leads_total: z.number(),
  leads_by_type: z.record(z.string(), z.number()),
  quote_leads: z.number(),
  top_lanes: z.array(LaneSchema.extend({ estimates: z.number() })),
  unserved_lanes: z.array(LaneSchema.extend({ reason: z.string(), requests: z.number() })),
  top_sources: z.array(z.object({ source: z.string(), medium: z.string(), leads: z.number() })),
});
export type Summary = z.infer<typeof SummarySchema>;

const TYPE_LABEL: Record<string, string> = {
  quote: "Quote callbacks",
  business: "Business accounts",
  transporter: "Transporter applications",
  driver_waitlist: "Driver waitlist",
  contact: "Contact messages",
  grievance: "Grievances",
  account_deletion: "Data deletion requests",
};

// Email clients need inline colours: take them from the design tokens.
const ink = themes.light;

const pct = (n: number, d: number) => (d > 0 ? `${((n / d) * 100).toFixed(1)}%` : "–");
const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium" });

export function renderSummary(s: Summary): { subject: string; html: string; text: string } {
  const range = `${day(s.from)} – ${day(new Date(new Date(s.to).getTime() - 1).toISOString())}`;
  const conversion = pct(s.quote_leads, s.estimates_shown);
  const table = (head: string[], rows: (string | number)[][]) =>
    rows.length === 0
      ? `<p style="color:${ink["muted-foreground"]}">None this week.</p>`
      : `<table style="border-collapse:collapse;font-family:sans-serif;font-size:14px"><tr>${head
          .map(
            (h) =>
              `<th align="left" style="padding:4px 12px 4px 0;border-bottom:1px solid ${ink.border}">${escapeHtml(h)}</th>`,
          )
          .join("")}</tr>${rows
          .map(
            (r) =>
              `<tr>${r.map((c) => `<td style="padding:4px 12px 4px 0">${escapeHtml(String(c))}</td>`).join("")}</tr>`,
          )
          .join("")}</table>`;

  const leadRows = Object.entries(s.leads_by_type)
    .sort((a, b) => b[1] - a[1])
    .map(([type, n]) => [TYPE_LABEL[type] ?? type, n]);
  const html = `<div style="font-family:sans-serif;max-width:640px">
<h1 style="font-size:20px">TruckBuck weekly summary</h1>
<p style="color:${ink["muted-foreground"]}">${escapeHtml(range)} (IST)</p>
${table(
  ["Metric", "Value"],
  [
    ["Fare estimates shown", s.estimates_shown],
    ["  …on routes we don't serve yet", s.estimates_unserved],
    ["Estimates that failed", s.estimates_failed],
    ["Leads (all types)", s.leads_total],
    ["Quote callbacks", s.quote_leads],
    ["Estimate → callback conversion", conversion],
  ],
)}
<h2 style="font-size:16px">Leads by type</h2>
${table(["Type", "Leads"], leadRows)}
<h2 style="font-size:16px">Top lanes (estimates)</h2>
${table(
  ["From", "To", "Estimates"],
  s.top_lanes.map((l) => [l.from_place, l.to_place, l.estimates]),
)}
<h2 style="font-size:16px">Top sources (leads)</h2>
${table(
  ["Source", "Medium", "Leads"],
  s.top_sources.map((x) => [x.source, x.medium, x.leads]),
)}
<h2 style="font-size:16px">Unserved demand</h2>
<p style="color:${ink["muted-foreground"]}">Routes people asked for that we couldn't price or don't serve yet.</p>
${table(
  ["From", "To", "Why", "Requests"],
  s.unserved_lanes.map((l) => [l.from_place, l.to_place, l.reason.replace(/_/g, " "), l.requests]),
)}
<p style="color:${ink["muted-foreground"]};font-size:12px">Counts exclude test leads. Estimates are counted in the browser, so ad blockers don't affect them; GA4 shows the full funnel for visitors who accepted analytics.</p>
</div>`;

  const lines = [
    `TruckBuck weekly summary — ${range} (IST)`,
    "",
    `Estimates shown: ${s.estimates_shown} (unserved routes: ${s.estimates_unserved}, failed: ${s.estimates_failed})`,
    `Leads: ${s.leads_total} — quote callbacks ${s.quote_leads}, conversion ${conversion}`,
    ...leadRows.map(([t, n]) => `  ${t}: ${n}`),
    "",
    "Top lanes:",
    ...s.top_lanes.map((l) => `  ${l.from_place} → ${l.to_place}: ${l.estimates}`),
    "",
    "Top sources:",
    ...s.top_sources.map((x) => `  ${x.source} / ${x.medium}: ${x.leads}`),
    "",
    "Unserved demand:",
    ...s.unserved_lanes.map(
      (l) => `  ${l.from_place} → ${l.to_place} (${l.reason}): ${l.requests}`,
    ),
  ];
  return {
    subject: `TruckBuck weekly: ${s.estimates_shown} estimates, ${s.leads_total} leads (${range})`,
    html,
    text: lines.join("\n"),
  };
}

/** Builds and emails the summary for the 7 days before `now`. */
export async function sendWeeklySummary(now = new Date()) {
  const to = now.toISOString();
  const from = new Date(now.getTime() - 7 * 86_400_000).toISOString();
  const result = await siteRpc<unknown>("site_weekly_summary", { p_from: from, p_to: to });
  if (!result) return { status: "skipped" as const, reason: "supabase not configured" };
  if (result.error) return { status: "failed" as const, reason: result.error.message };
  const summary = SummarySchema.parse(result.data);
  const email = renderSummary(summary);
  const sent = await sendEmail({
    to: serverEnv.summaryEmails,
    ...email,
    idempotencyKey: `weekly-${from.slice(0, 10)}`,
  });
  return { status: sent, summary };
}
