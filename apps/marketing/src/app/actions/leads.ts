"use server";

import { after } from "next/server";

import {
  BusinessLeadInputSchema,
  DriverWaitlistInputSchema,
  type LeadResult,
  TransporterLeadInputSchema,
} from "@truckbuck/types";
import { isValidGstin, normalizeGstin } from "@truckbuck/utils";

import { getContent } from "@/content";
import {
  annotateLead,
  fieldErrorsFrom,
  guardLead,
  insertLead,
  LEAD_CONSENT_VERSION,
  referenceFor,
} from "@/server/leads";
import { sendTransporterAck } from "@/server/whatsapp-cloud";

function common(input: {
  utm: Record<string, string | undefined>;
  sourcePath?: string | undefined;
  referrer?: string | undefined;
  locale: "en" | "hi" | "ta";
}) {
  return {
    utm: input.utm,
    source_path: input.sourcePath ?? null,
    referrer: input.referrer ?? null,
    locale: input.locale,
    consent_contact: true,
    consent_text_version: LEAD_CONSENT_VERSION,
    status: "new",
  };
}

/** /transporters — 2-step application. type = "transporter", status = "new". */
export async function submitTransporterLead(input: unknown): Promise<LeadResult> {
  const content = getContent();
  const parsed = TransporterLeadInputSchema.safeParse(input);
  if (!parsed.success) {
    const t = content.transporters.form;
    return {
      ok: false,
      reason: "invalid",
      fieldErrors: fieldErrorsFrom(parsed.error.flatten().fieldErrors, {
        name: content.forms.nameError,
        phone: content.forms.phoneError,
        city: content.forms.cityError,
        fleetSize: t.fleetSizeError,
        truckTypes: t.truckTypesError,
        homeBase: t.homeBaseError,
      }),
    };
  }
  const lead = parsed.data;
  const guard = await guardLead({ ...lead, phoneError: getContent(lead.locale).forms.phoneError });
  if (!guard.ok) return guard.result;

  const saved = await insertLead({
    type: "transporter",
    name: lead.name,
    phone_e164: guard.phoneE164,
    city: lead.city,
    details: {
      fleet_size: lead.fleetSize,
      truck_types: lead.truckTypes,
      home_base: lead.homeBase,
      lanes: lead.lanes ?? null,
    },
    ...common(lead),
  });
  if (!saved) return { ok: false, reason: "unavailable" };

  const reference = referenceFor(saved.id);
  // Acknowledge on WhatsApp after the response is sent; record the outcome on the lead.
  after(async () => {
    const outcome = await sendTransporterAck(guard.phoneE164, reference, lead.locale);
    await annotateLead(saved.id, { whatsapp_ack: outcome });
  });
  return { ok: true, reference, served: true };
}

/** /shippers — business account request. type = "business". */
export async function submitBusinessLead(input: unknown): Promise<LeadResult> {
  const content = getContent();
  const f = content.shippers.form;
  const parsed = BusinessLeadInputSchema.safeParse(input);
  const gstinRaw =
    typeof input === "object" && input && "gstin" in input && typeof input.gstin === "string"
      ? input.gstin
      : "";
  const gstinBad = gstinRaw.trim() !== "" && !isValidGstin(gstinRaw);
  if (!parsed.success || gstinBad) {
    return {
      ok: false,
      reason: "invalid",
      fieldErrors: {
        ...(parsed.success
          ? {}
          : fieldErrorsFrom(parsed.error.flatten().fieldErrors, {
              name: content.forms.nameError,
              phone: content.forms.phoneError,
              company: content.forms.required,
              lanes: f.lanesError,
              monthlyTrips: content.forms.required,
              gstin: f.gstinError,
            })),
        ...(gstinBad ? { gstin: f.gstinError } : {}),
      },
    };
  }
  const lead = parsed.data;
  const guard = await guardLead({ ...lead, phoneError: content.forms.phoneError });
  if (!guard.ok) return guard.result;

  const saved = await insertLead({
    type: "business",
    name: lead.name,
    phone_e164: guard.phoneE164,
    email: lead.email || null,
    company: lead.company,
    details: {
      gstin: lead.gstin ? normalizeGstin(lead.gstin) : null,
      monthly_trips: lead.monthlyTrips,
      lanes: lead.lanes,
    },
    ...common(lead),
  });
  return saved
    ? { ok: true, reference: referenceFor(saved.id), served: true }
    : { ok: false, reason: "unavailable" };
}

/** /drivers (+ /hi, /ta) — rewards waitlist. type = "driver_waitlist". */
export async function submitDriverWaitlist(input: unknown): Promise<LeadResult> {
  const parsed = DriverWaitlistInputSchema.safeParse(input);
  if (!parsed.success) {
    const locale =
      typeof input === "object" &&
      input &&
      "locale" in input &&
      (input.locale === "hi" || input.locale === "ta")
        ? input.locale
        : "en";
    const forms = getContent(locale).forms;
    return {
      ok: false,
      reason: "invalid",
      fieldErrors: fieldErrorsFrom(parsed.error.flatten().fieldErrors, {
        name: forms.nameError,
        phone: forms.phoneError,
        city: forms.cityError,
      }),
    };
  }
  const lead = parsed.data;
  const guard = await guardLead({ ...lead, phoneError: getContent(lead.locale).forms.phoneError });
  if (!guard.ok) return guard.result;

  const saved = await insertLead({
    type: "driver_waitlist",
    name: lead.name,
    phone_e164: guard.phoneE164,
    city: lead.city,
    details: { transporter: lead.transporter ?? null, programme: "safe_driving_rewards" },
    ...common(lead),
  });
  return saved
    ? { ok: true, reference: referenceFor(saved.id), served: true }
    : { ok: false, reason: "unavailable" };
}
