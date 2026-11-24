import type { NfcRef } from "@/components/missing-fact";
import { getContent } from "@/content";
import { company } from "@/content/company";
import { fill } from "@/lib/format";
import { getSiteConfig } from "@/server/catalog";

/** One `{token}` in legal text: the real value, or what to say until it exists. */
export interface LegalFact {
  value: string | null;
  missing: NfcRef;
  /** Production wording while the value is missing (development shows a marker). */
  fallback: string;
}

export type LegalFactKey = keyof ReturnType<typeof getContent>["legal"]["fallbacks"];
export type LegalFacts = Record<LegalFactKey, LegalFact>;

/**
 * Every company or policy fact the legal pages refer to, resolved from
 * src/content/company.ts and ops-editable site_config. Nothing is guessed:
 * a missing value stays missing and the page says so in development.
 */
export async function getLegalFacts(): Promise<LegalFacts> {
  const { legal } = getContent();
  const f = legal.formats;
  const [charges, fee] = await Promise.all([
    getSiteConfig("shipper.charges"),
    getSiteConfig("transporter.fee"),
  ]);
  const days = (n: number | null) => (n === null ? null : fill(f.days, { n }));
  const officer = company.grievanceOfficer;

  const facts: Record<LegalFactKey, Omit<LegalFact, "fallback">> = {
    legalName: { value: company.legalName, missing: "registered legal name (NFC-4)" },
    address: { value: company.registeredAddress, missing: "registered office address (NFC-4)" },
    grievanceContact: {
      value: officer
        ? fill(f.officer, {
            name: officer.name,
            designation: officer.designation,
            email: officer.email,
          })
        : null,
      missing: "Grievance Officer name and contact (NFC-19)",
    },
    ackTimeline: {
      value: days(company.grievanceTimelines.acknowledgeDays),
      missing: "grievance acknowledgement time (NFC-19)",
    },
    resolveTimeline: {
      value: days(company.grievanceTimelines.resolveDays),
      missing: "grievance resolution time (NFC-19)",
    },
    leadRetention: {
      value:
        company.leadRetentionMonths === null
          ? null
          : fill(f.months, { n: company.leadRetentionMonths }),
      missing: "retention period for enquiries (NFC-19)",
    },
    paymentTerms: { value: charges.payment_terms, missing: "shipper payment terms (NFC-11)" },
    cancellationTerms: { value: charges.cancellation, missing: "cancellation policy (NFC-11)" },
    feePercent: {
      value: fee.percent === null ? null : fill(f.fee, { percent: fee.percent }),
      missing: "transporter per-trip fee (NFC-11)",
    },
    payoutTimeline: {
      value: fee.payout_days === null ? null : fill(f.payout, { n: fee.payout_days }),
      missing: "transporter payout timeline (NFC-11)",
    },
    jurisdiction: { value: company.jurisdictionCity, missing: "court jurisdiction city (NFC-19)" },
    refundDays: {
      value: company.refundDays === null ? null : fill(f.workingDays, { n: company.refundDays }),
      missing: "refund timeline (NFC-11)",
    },
  };

  return Object.fromEntries(
    (Object.keys(facts) as LegalFactKey[]).map((key) => [
      key,
      { ...facts[key], fallback: legal.fallbacks[key] },
    ]),
  ) as LegalFacts;
}
