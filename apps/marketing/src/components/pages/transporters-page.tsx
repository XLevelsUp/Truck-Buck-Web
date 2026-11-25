import type { Metadata } from "next";
import {
  BadgeIndianRupee,
  CalendarCheck,
  FileText,
  Handshake,
  Truck,
  UserRoundCheck,
} from "lucide-react";

import { Button } from "@truckbuck/ui/button";
import { formatINR } from "@truckbuck/utils";

import { TransporterApplication } from "@/components/forms/transporter-application";
import { MissingFact, type NfcRef } from "@/components/missing-fact";
import { FeatureGrid, FinalCta, PageFaq, PageHero } from "@/components/page/page-blocks";
import { Section, SectionHeading } from "@/components/page/section";
import { languageAlternates } from "@/components/pages/home-page";
import { type Content, getContent } from "@/content";
import { vettingTimeline } from "@/content/features";
import { env } from "@/env";
import { type Locale, localizedHref } from "@/i18n/locales";
import { heroCopy, type HeroVariant } from "@/lib/experiments";
import { fill } from "@/lib/format";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { getCatalog, getSiteConfig, type TransporterFeeConfig } from "@/server/catalog";

export function transportersMetadata(locale: Locale): Metadata {
  const t = getContent(locale).transporters;
  const base = pageMetadata({
    title: t.meta.title,
    description: t.meta.description,
    path: localizedHref(locale, routes.transporters.path),
  });
  return {
    ...base,
    alternates: { ...base.alternates, languages: languageAlternates(routes.transporters.path) },
  };
}

/** /transporters, /hi/transporters, /ta/transporters. */
export async function TransportersPage({
  locale,
  heroVariant,
}: {
  locale: Locale;
  /** A/B hero variant (English only). */
  heroVariant?: HeroVariant | undefined;
}) {
  const content = getContent(locale);
  const t = content.transporters;
  const hero = heroCopy("transporters", locale, heroVariant);
  const f = content.features;
  const [catalog, fee] = await Promise.all([getCatalog(), getSiteConfig("transporter.fee")]);

  const application = (
    <div id="apply" className="scroll-mt-20 rounded-2xl border bg-surface p-4 shadow-lg md:p-6">
      <h2 className="text-2xl font-bold">{t.form.title}</h2>
      <p className="mt-1 mb-5 text-muted-foreground">{t.form.lead}</p>
      <TransporterApplication
        labels={{ form: t.form, forms: content.forms, common: content.common }}
        trucks={catalog.trucks.map(({ slug, name }) => ({ slug, name }))}
        privacyHref={routes.privacy.path}
        turnstileSiteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null}
        whatsappNumber={env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? null}
        locale={locale}
      />
    </div>
  );

  return (
    <>
      <PageHero
        eyebrow={t.hero.eyebrow}
        title={hero.title}
        lead={hero.lead}
        variant={hero.variant}
        actions={
          <Button asChild variant="cta" size="lg" className="lg:hidden">
            <a href="#apply">{hero.cta}</a>
          </Button>
        }
        aside={application}
      />

      <Section labelledBy="benefits-title" tone="muted">
        <SectionHeading id="benefits-title" title={t.benefitsTitle} />
        <FeatureGrid
          roadmapLabel={content.common.roadmap}
          items={[
            { key: "noBidding", icon: <Handshake />, ...f.noBidding },
            { key: "steadyLoads", icon: <Truck />, ...f.steadyLoads },
            { key: "transparentFee", icon: <BadgeIndianRupee />, ...f.transparentFee },
            { key: "onTimePayment", icon: <CalendarCheck />, ...f.onTimePayment },
            { key: "driverAssignment", icon: <UserRoundCheck />, ...f.driverAssignment },
          ]}
        />
      </Section>

      <Section labelledBy="vetting-title">
        <SectionHeading id="vetting-title" title={t.vetting.title} lead={t.vetting.lead} />
        <div className="grid gap-8 lg:grid-cols-2">
          <ol className="grid gap-3">
            {t.vetting.steps.map((step, index) => (
              <li key={step.title} className="flex gap-4 rounded-xl border bg-surface p-4">
                <span
                  aria-hidden="true"
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-primary font-bold text-primary-foreground"
                >
                  {index + 1}
                </span>
                <span className="grid gap-0.5">
                  <span className="text-lg font-bold">{step.title}</span>
                  <span className="text-muted-foreground">{step.body}</span>
                </span>
              </li>
            ))}
            <li className="text-muted-foreground">
              <span className="font-semibold text-foreground">{t.vetting.timeline}:</span>{" "}
              {vettingTimeline ?? <MissingFact what="verification timeline (NFC-5)" />}
            </li>
          </ol>
          <div className="grid content-start gap-3 rounded-xl bg-surface-muted p-5">
            <h3 className="flex items-center gap-2 text-xl font-bold">
              <FileText aria-hidden="true" className="size-5 text-primary" />
              {t.vetting.documentsTitle}
            </h3>
            <ul className="grid list-disc gap-1.5 pl-5">
              {t.vetting.documents.map((doc) => (
                <li key={doc}>{doc}</li>
              ))}
            </ul>
            <p className="rounded-lg border border-info bg-info-soft p-3 text-sm text-info-soft-foreground">
              {t.vetting.noUpload}
            </p>
          </div>
        </div>
      </Section>

      <FeeSection fee={fee} t={t.fee} />

      <PageFaq faqs={content.pageFaqs.transporters} title={content.common.faqTitle} />

      <FinalCta
        title={t.final.title}
        body={t.final.body}
        actions={
          <Button asChild variant="cta" size="lg">
            <a href="#apply">{hero.cta}</a>
          </Button>
        }
      />
    </>
  );
}

function FeeSection({ fee, t }: { fee: TransporterFeeConfig; t: Content["transporters"]["fee"] }) {
  const items: { label: string; value: string | null; missing: NfcRef }[] = [
    {
      label: t.percent,
      value: fee.percent === null ? null : fill(t.percentValue, { percent: fee.percent }),
      missing: "per-trip fee % (NFC-11)",
    },
    {
      label: t.minimum,
      value:
        fee.minimum_paise === null ? null : formatINR(fee.minimum_paise, { wholeRupees: true }),
      missing: "minimum fee (NFC-11)",
    },
    {
      label: t.payout,
      value: fee.payout_days === null ? null : fill(t.payoutValue, { days: fee.payout_days }),
      missing: "payout timeline (NFC-11)",
    },
  ];
  const production = process.env.NODE_ENV === "production";
  // No real numbers yet: say nothing in production rather than show empty boxes.
  if (production && items.every((item) => item.value === null)) return null;
  return (
    <Section labelledBy="fee-title" tone="muted">
      <SectionHeading id="fee-title" title={t.title} lead={t.lead} />
      <dl className="grid gap-4 md:grid-cols-3">
        {items
          .filter((item) => item.value !== null || !production)
          .map((item) => (
            <div key={item.label} className="grid gap-1 rounded-xl border bg-surface p-5">
              <dt className="text-muted-foreground">{item.label}</dt>
              <dd className="text-2xl font-bold">
                {item.value ?? <MissingFact what={item.missing} />}
              </dd>
            </div>
          ))}
      </dl>
    </Section>
  );
}
