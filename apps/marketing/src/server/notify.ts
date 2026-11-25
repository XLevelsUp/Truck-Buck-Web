import "server-only";

import { formatIndianMobile, formatINR } from "@truckbuck/utils";

import { company } from "@/content/company";
import { env } from "@/env";
import { serverEnv } from "@/env.server";
import { type ConversionContext, type ConversionEvent, sendConversion } from "@/server/ga4";
import { annotateLead } from "@/server/leads";
import { log } from "@/server/log";
import { sendTemplate, type WhatsappLocale } from "@/server/whatsapp-cloud";

import { escapeHtml, sendEmail } from "./email";

/**
 * New-lead fan-out, run with `after()` once the lead is saved, so the visitor
 * gets their reference immediately:
 *
 *   ops WhatsApp (template) · ops email (Resend) · Google Sheet row
 *   · customer WhatsApp acknowledgement · GA4 server-side conversion
 *
 * Channels run in parallel with their own timeouts; one failing never blocks
 * another. Outcomes and the total time are recorded on the lead (details.notify).
 */

/** The lead row as inserted (see actions/*.ts). */
export type LeadRow = Record<string, unknown> & {
  type: string;
  name: string;
  phone_e164: string;
  locale?: string;
  utm?: Record<string, string | undefined>;
};

const TYPE_LABEL: Record<string, string> = {
  quote: "Quote callback",
  business: "Business account",
  transporter: "Transporter application",
  driver_waitlist: "Driver waitlist",
  contact: "Contact message",
  grievance: "Grievance",
  account_deletion: "Data deletion request",
};

const CONVERSION: Partial<Record<string, ConversionEvent>> = {
  quote: "callback_submitted",
  business: "business_enquiry_submitted",
  transporter: "transporter_submitted",
  driver_waitlist: "driver_waitlist_submitted",
  contact: "contact_submitted",
};

type Place = { label?: string } | null | undefined;
const placeLabel = (place: unknown) => (place as Place)?.label ?? null;
const str = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
};
const details = (row: LeadRow) => (row.details ?? {}) as Record<string, unknown>;

/** One line ops can act on: route, truck, fare, or the form's key answer. */
export function leadSummary(row: LeadRow): string {
  const d = details(row);
  switch (row.type) {
    case "quote": {
      const from = placeLabel(row.pickup) ?? "?";
      const to = placeLabel(row.drop) ?? "?";
      const fare =
        typeof row.fare_min_paise === "number" && typeof row.fare_max_paise === "number"
          ? `${formatINR(row.fare_min_paise, { wholeRupees: true })}–${formatINR(row.fare_max_paise, { wholeRupees: true })}`
          : "no fare";
      return `${from} → ${to} · ${str(row.truck_type_slug)} · ${str(row.pickup_date)} · ${fare}${row.served === false ? " · NOT SERVED" : ""}`;
    }
    case "transporter":
      return `${str(row.city)} · fleet ${str(d.fleet_size)} · ${[d.truck_types].flat().filter(Boolean).join(", ")}`;
    case "business":
      return `${str(row.company)} · ${str(d.monthly_trips)} trips/month · ${str(d.lanes)}`;
    case "driver_waitlist":
      return `${str(row.city)}${d.transporter ? ` · drives for ${str(d.transporter)}` : ""}`;
    case "contact":
    case "grievance":
    case "account_deletion":
      return `${str(d.topic ?? d.kind)} · ${str(d.message).slice(0, 140)}`;
    default:
      return "";
  }
}

function source(row: LeadRow) {
  const utm = row.utm ?? {};
  return {
    source: utm.utm_source ?? (row.referrer ? hostOf(str(row.referrer)) : "(direct)"),
    medium: utm.utm_medium ?? "(none)",
    campaign: utm.utm_campaign ?? "",
    landing: utm.landing_path ?? "",
  };
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url.slice(0, 60);
  }
}

const istTime = () =>
  new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

/* ------------------------------------------------------------------------ */
/* Channels                                                                 */
/* ------------------------------------------------------------------------ */

async function opsWhatsapp(row: LeadRow, reference: string) {
  const numbers = serverEnv.whatsappOpsNumbers;
  if (numbers.length === 0) return "skipped" as const;
  const phone = formatIndianMobile(row.phone_e164) ?? row.phone_e164;
  const results = await Promise.all(
    numbers.map((to) =>
      sendTemplate("ops", to, [
        TYPE_LABEL[row.type] ?? row.type,
        reference,
        row.name,
        phone,
        leadSummary(row),
      ]),
    ),
  );
  return results.every((r) => r === "sent")
    ? "sent"
    : results.includes("failed")
      ? "failed"
      : "skipped";
}

function opsEmail(row: LeadRow, reference: string) {
  const s = source(row);
  const phone = formatIndianMobile(row.phone_e164) ?? row.phone_e164;
  const rows: [string, string][] = [
    ["Type", TYPE_LABEL[row.type] ?? row.type],
    ["Reference", reference],
    ["Name", row.name],
    ["Phone", phone],
    ["Details", leadSummary(row)],
    ["Source", `${s.source} / ${s.medium}${s.campaign ? ` / ${s.campaign}` : ""}`],
    ["Landing page", s.landing],
    ["Submitted on", str(row.source_path)],
    ["Language", str(row.locale)],
    ["Received", `${istTime()} IST`],
  ];
  const html = `<h2 style="font-family:sans-serif">New ${escapeHtml(TYPE_LABEL[row.type] ?? row.type)} — ${escapeHtml(reference)}</h2>
<table style="font-family:sans-serif;border-collapse:collapse">${rows
    .map(
      ([k, v]) =>
        `<tr><th align="left" style="padding:4px 12px 4px 0;vertical-align:top">${escapeHtml(k)}</th><td style="padding:4px 0">${escapeHtml(v)}</td></tr>`,
    )
    .join("")}</table>
<p style="font-family:sans-serif"><a href="tel:${escapeHtml(row.phone_e164)}">Call ${escapeHtml(phone)}</a> · <a href="https://wa.me/${escapeHtml(row.phone_e164.replace(/^\+/, ""))}">WhatsApp</a></p>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  return sendEmail({
    to: serverEnv.opsEmails,
    subject: `New lead ${reference}: ${TYPE_LABEL[row.type] ?? row.type} — ${row.name}`,
    html,
    text,
    idempotencyKey: `lead-${reference}`,
  });
}

async function sheetRow(row: LeadRow, reference: string) {
  const cfg = serverEnv.sheet;
  if (!cfg) {
    log.warn("[sheet] SHEET_WEBHOOK_URL/SECRET not configured — row skipped");
    return "skipped" as const;
  }
  const s = source(row);
  try {
    const response = await fetch(cfg.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: cfg.secret,
        row: {
          received_ist: istTime(),
          reference,
          type: TYPE_LABEL[row.type] ?? row.type,
          status: "New",
          owner: "",
          name: row.name,
          phone: row.phone_e164,
          details: leadSummary(row),
          served: row.served === undefined ? "" : row.served ? "yes" : "no",
          source: s.source,
          medium: s.medium,
          campaign: s.campaign,
          landing_page: s.landing,
          page: str(row.source_path),
          language: str(row.locale),
        },
      }),
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
    const body = (await response.json().catch(() => null)) as { ok?: boolean } | null;
    if (!response.ok || body?.ok !== true) {
      log.error("[sheet] append failed", response.status);
      return "failed" as const;
    }
    return "sent" as const;
  } catch (error) {
    log.error("[sheet] append failed", error);
    return "failed" as const;
  }
}

async function customerAck(row: LeadRow, reference: string, kind: "ack" | "transporter") {
  const locale = (
    ["en", "hi", "ta"].includes(str(row.locale)) ? row.locale : "en"
  ) as WhatsappLocale;
  if (kind === "transporter")
    return sendTemplate("transporter", row.phone_e164, [reference], locale);
  if (company.callbackMinutes === null) return "skipped" as const;
  return sendTemplate("ack", row.phone_e164, [reference, String(company.callbackMinutes)], locale);
}

/* ------------------------------------------------------------------------ */

export interface NotifyOptions {
  /** Customer acknowledgement on WhatsApp: generic callback ack, transporter template, or none. */
  ack: "ack" | "transporter" | null;
  conversion: ConversionContext;
}

export async function processNewLead(
  leadId: string,
  reference: string,
  row: LeadRow,
  options: NotifyOptions,
): Promise<void> {
  const started = Date.now();
  const event = CONVERSION[row.type];
  const [whatsapp, email, sheet, ack, ga4] = await Promise.all([
    opsWhatsapp(row, reference),
    opsEmail(row, reference),
    sheetRow(row, reference),
    options.ack ? customerAck(row, reference, options.ack) : Promise.resolve("skipped" as const),
    event
      ? sendConversion(options.conversion, event, {
          lead_type: row.type,
          truck: str(row.truck_type_slug) || undefined,
          served: typeof row.served === "boolean" ? row.served : undefined,
          campaign_source: row.utm?.utm_source,
          campaign_medium: row.utm?.utm_medium,
          campaign_name: row.utm?.utm_campaign,
          language: str(row.locale),
          site: env.NEXT_PUBLIC_SITE_URL,
        })
      : Promise.resolve("skipped" as const),
  ]);
  const notify = { ops_whatsapp: whatsapp, ops_email: email, sheet, customer_whatsapp: ack, ga4 };
  const elapsed = Date.now() - started;
  await annotateLead(leadId, { notify, notify_ms: elapsed, whatsapp_ack: ack });
  if (Object.values(notify).includes("failed")) log.error("[notify] channel failed", notify);
}
