import type { Metadata } from "next";

import { SupportForm } from "@/components/forms/support-form";
import { LegalDocument, LegalText } from "@/components/legal-document";
import { MissingFact } from "@/components/missing-fact";
import { getContent } from "@/content";
import { company } from "@/content/company";
import { env } from "@/env";
import { getLegalFacts } from "@/lib/legal-facts";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";

const content = getContent();
const g = content.grievance;

export const metadata: Metadata = pageMetadata({
  title: g.title,
  description: g.description,
  path: routes.grievance.path,
});

/**
 * Grievance redressal (DPDP Act, 2023): who the Grievance Officer is, how
 * long we take, and a form that files complaints and data-rights requests
 * as leads (erasure → account_deletion). Officer details are NFC-19.
 */
export default async function GrievancePage() {
  const facts = await getLegalFacts();
  const officer = company.grievanceOfficer;
  const fields = g.officerFields;
  return (
    <LegalDocument
      title={g.title}
      lastUpdated={g.lastUpdated}
      intro={g.intro}
      sections={[]}
      facts={facts}
    >
      <section aria-labelledby="officer-title" className="mt-10 rounded-xl border bg-surface p-5">
        <h2 id="officer-title" className="text-2xl font-bold">
          {g.officerTitle}
        </h2>
        {officer ? (
          <dl className="mt-3 grid gap-2 md:grid-cols-[auto_1fr] md:gap-x-6">
            <dt className="font-semibold">{fields.name}</dt>
            <dd>{officer.name}</dd>
            <dt className="font-semibold">{fields.designation}</dt>
            <dd>{officer.designation}</dd>
            <dt className="font-semibold">{fields.email}</dt>
            <dd>
              <a href={`mailto:${officer.email}`} className="text-link underline">
                {officer.email}
              </a>
            </dd>
            {officer.phone ? (
              <>
                <dt className="font-semibold">{fields.phone}</dt>
                <dd>
                  <a href={`tel:${officer.phone}`} className="text-link underline">
                    {officer.phone}
                  </a>
                </dd>
              </>
            ) : null}
          </dl>
        ) : (
          <p className="mt-3">
            <MissingFact what="Grievance Officer name, designation and contact (NFC-19)" />
          </p>
        )}
      </section>

      <section aria-labelledby="timelines-title" className="mt-10">
        <h2 id="timelines-title" className="text-2xl font-bold">
          {g.timelinesTitle}
        </h2>
        <p className="mt-3 leading-7">
          <LegalText text={g.timelines} facts={facts} />
        </p>
        <p className="mt-3 leading-7">{g.escalation}</p>
      </section>

      <section aria-labelledby="grievance-form-title" className="mt-10" id="request">
        <h2 id="grievance-form-title" className="mb-5 text-2xl font-bold">
          {g.formTitle}
        </h2>
        <SupportForm
          mode="grievance"
          labels={{ support: content.support, forms: content.forms, common: content.common }}
          privacyHref={routes.privacy.path}
          turnstileSiteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null}
        />
      </section>
    </LegalDocument>
  );
}
