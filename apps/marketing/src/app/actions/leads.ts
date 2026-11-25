"use server";

import { headers } from "next/headers";
import { after } from "next/server";

import {
  BusinessLeadInputSchema,
  ContactLeadInputSchema,
  DriverWaitlistInputSchema,
  GrievanceLeadInputSchema,
  type LeadResult,
  TransporterLeadInputSchema,
} from "@truckbuck/types";
import { isValidGstin, normalizeGstin } from "@truckbuck/utils";

import { getContent } from "@/content";
import { conversionContext } from "@/server/ga4";
import {
  fieldErrorsFrom,
  guardLead,
  insertLead,
  LEAD_CONSENT_VERSION,
  referenceFor,
} from "@/server/leads";
import { type LeadRow, processNewLead } from "@/server/notify";

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

/**
 * Saves the lead, answers the visitor with their reference at once, then
 * (after the response) alerts ops on WhatsApp + email, appends the Sheet row,
 * acknowledges the customer on WhatsApp and sends the GA4 conversion.
 */
async function saveAndNotify(row: LeadRow, ack: "ack" | "transporter" | null): Promise<LeadResult> {
  const conversion = conversionContext((await headers()).get("cookie"));
  const saved = await insertLead(row);
  if (!saved) return { ok: false, reason: "unavailable" };
  const reference = referenceFor(saved.id);
  after(() => processNewLead(saved.id, reference, row, { ack, conversion }));
  return { ok: true, reference, served: true };
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
  const guard = await guardLead({
    ...lead,
    phoneError: getContent(lead.locale).forms.phoneError,
    action: "transporter_apply",
  });
  if (!guard.ok) return guard.result;

  return saveAndNotify(
    {
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
    },
    "transporter",
  );
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
  const guard = await guardLead({
    ...lead,
    phoneError: content.forms.phoneError,
    action: "business_account",
  });
  if (!guard.ok) return guard.result;

  return saveAndNotify(
    {
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
    },
    "ack",
  );
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
  const guard = await guardLead({
    ...lead,
    phoneError: getContent(lead.locale).forms.phoneError,
    action: "driver_waitlist",
  });
  if (!guard.ok) return guard.result;

  return saveAndNotify(
    {
      type: "driver_waitlist",
      name: lead.name,
      phone_e164: guard.phoneE164,
      city: lead.city,
      details: { transporter: lead.transporter ?? null, programme: "safe_driving_rewards" },
      ...common(lead),
    },
    null,
  );
}

/** /contact — general enquiry, routed by topic (shipper / transporter / press / other). */
export async function submitContactLead(input: unknown): Promise<LeadResult> {
  const content = getContent();
  const parsed = ContactLeadInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "invalid",
      fieldErrors: fieldErrorsFrom(parsed.error.flatten().fieldErrors, {
        name: content.forms.nameError,
        phone: content.forms.phoneError,
        topic: content.forms.required,
        message: content.support.messageError,
        email: content.support.emailError,
      }),
    };
  }
  const lead = parsed.data;
  const guard = await guardLead({
    ...lead,
    phoneError: content.forms.phoneError,
    action: "contact",
  });
  if (!guard.ok) return guard.result;

  return saveAndNotify(
    {
      type: "contact",
      name: lead.name,
      phone_e164: guard.phoneE164,
      email: lead.email || null,
      company: lead.company || null,
      details: { topic: lead.topic, message: lead.message },
      ...common(lead),
    },
    "ack",
  );
}

/**
 * /grievance — complaints and DPDP Act rights requests (access, correction,
 * erasure). Erasure requests are stored as type "account_deletion" so ops
 * can action them separately; everything else as "grievance".
 */
export async function submitGrievance(input: unknown): Promise<LeadResult> {
  const content = getContent();
  const parsed = GrievanceLeadInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "invalid",
      fieldErrors: fieldErrorsFrom(parsed.error.flatten().fieldErrors, {
        name: content.forms.nameError,
        phone: content.forms.phoneError,
        kind: content.forms.required,
        message: content.support.messageError,
        email: content.support.emailError,
      }),
    };
  }
  const lead = parsed.data;
  const guard = await guardLead({
    ...lead,
    phoneError: content.forms.phoneError,
    action: "grievance",
  });
  if (!guard.ok) return guard.result;

  return saveAndNotify(
    {
      type: lead.kind === "erasure" ? "account_deletion" : "grievance",
      name: lead.name,
      phone_e164: guard.phoneE164,
      email: lead.email || null,
      details: { kind: lead.kind, message: lead.message, reference: lead.reference ?? null },
      ...common(lead),
    },
    null,
  );
}
