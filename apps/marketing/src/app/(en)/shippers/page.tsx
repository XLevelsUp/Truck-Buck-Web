import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeIndianRupee,
  ChartColumn,
  FileCheck2,
  FileX2,
  Handshake,
  MapPinned,
  PhoneOff,
  ReceiptText,
  SearchX,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Button } from "@truckbuck/ui/button";

import { BusinessAccountForm } from "@/components/forms/business-account-form";
import { FeatureGrid, FinalCta, PageFaq, PageHero } from "@/components/page/page-blocks";
import { Section, SectionHeading } from "@/components/page/section";
import { getContent } from "@/content";
import { env } from "@/env";
import { heroCopy } from "@/lib/experiments";
import { getPriceHref, routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";

const content = getContent();

export const metadata: Metadata = pageMetadata({
  title: content.shippers.meta.title,
  description: content.shippers.meta.description,
  path: routes.shippers.path,
});

const problemIcons = [
  <PhoneOff key="a" />,
  <Handshake key="b" />,
  <SearchX key="c" />,
  <FileX2 key="d" />,
];

export default function ShippersPage() {
  const s = content.shippers;
  const f = content.features;
  const hero = heroCopy("shippers");
  return (
    <>
      <PageHero
        eyebrow={s.hero.eyebrow}
        title={hero.title}
        lead={hero.lead}
        variant={hero.variant}
        actions={
          <>
            <Button asChild variant="cta" size="lg">
              <a href="#business-account">{hero.cta}</a>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href={getPriceHref}>{s.hero.secondary}</Link>
            </Button>
          </>
        }
      />

      <Section labelledBy="problems-title" tone="muted">
        <SectionHeading id="problems-title" title={s.problems.title} />
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {s.problems.items.map((problem, index) => (
            <li
              key={problem.title}
              className="grid content-start gap-2 rounded-xl border bg-surface p-5"
            >
              <span
                aria-hidden="true"
                className="grid size-11 place-items-center rounded-lg bg-danger-soft text-danger-soft-foreground [&_svg]:size-5"
              >
                {problemIcons[index]}
              </span>
              <h3 className="text-lg font-bold">{problem.title}</h3>
              <p className="text-muted-foreground">{problem.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section labelledBy="features-title">
        <SectionHeading id="features-title" title={s.featuresTitle} />
        <FeatureGrid
          roadmapLabel={content.common.roadmap}
          items={[
            { key: "upfrontFare", icon: <BadgeIndianRupee />, ...f.upfrontFare },
            { key: "vettedNetwork", icon: <ShieldCheck />, ...f.vettedNetwork },
            { key: "liveTracking", icon: <MapPinned />, ...f.liveTracking },
            { key: "podPhotoSignature", icon: <FileCheck2 />, ...f.podPhotoSignature },
            { key: "gstInvoices", icon: <ReceiptText />, ...f.gstInvoices },
            { key: "tripReports", icon: <ChartColumn />, ...f.tripReports },
            { key: "teamAccounts", icon: <Users />, ...f.teamAccounts },
          ]}
        />
      </Section>

      <Section labelledBy="business-account-title" id="business-account" tone="muted">
        <SectionHeading id="business-account-title" title={s.form.title} lead={s.form.lead} />
        <div className="max-w-3xl rounded-2xl border bg-surface p-4 shadow-sm md:p-8">
          <BusinessAccountForm
            labels={{ form: s.form, forms: content.forms, common: content.common }}
            privacyHref={routes.privacy.path}
            turnstileSiteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null}
          />
        </div>
      </Section>

      <PageFaq faqs={content.pageFaqs.shippers} title={content.common.faqTitle} />

      <FinalCta
        title={s.final.title}
        body={s.final.body}
        actions={
          <>
            <Button asChild variant="cta" size="lg">
              <Link href={getPriceHref}>{content.cta.getPrice}</Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              size="lg"
              className="border-surface-brand-foreground/40 bg-transparent text-surface-brand-foreground hover:bg-surface-brand-foreground/10"
            >
              <a href="#business-account">{hero.cta}</a>
            </Button>
          </>
        }
      />
    </>
  );
}
