import type { Metadata } from "next";
import {
  FileCheck2,
  ListChecks,
  MessageCircle,
  Navigation,
  Signal,
  Smartphone,
  TouchpadOff,
} from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@truckbuck/ui/badge";

import { AppBadges } from "@/components/app-badges";
import { DriverWaitlistForm } from "@/components/forms/driver-waitlist-form";
import { MissingFact } from "@/components/missing-fact";
import { FinalCta, PageFaq, PageHero } from "@/components/page/page-blocks";
import { Section, SectionHeading } from "@/components/page/section";
import { getContent } from "@/content";
import { type FeatureKey, featureStatus, isShown } from "@/content/features";
import { env } from "@/env";
import { type Locale, localizedHref } from "@/i18n/locales";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { qrSvg } from "@/server/qr";

import { languageAlternates } from "./home-page";

const PATH: `/${string}` = routes.drivers.path;

/** Metadata with hreflang alternates for every language version. */
export function driversMetadata(locale: Locale): Metadata {
  const d = getContent(locale).drivers;
  const base = pageMetadata({
    title: d.meta.title,
    description: d.meta.description,
    path: localizedHref(locale, PATH),
  });
  return {
    ...base,
    alternates: {
      ...base.alternates,
      languages: languageAlternates(PATH),
    },
  };
}

const screenIcons: Record<string, ReactNode> = {
  tripDetails: <ListChecks />,
  navigate: <Navigation />,
  pod: <FileCheck2 />,
  whatsapp: <MessageCircle />,
};

const screenFeatures: Record<string, FeatureKey> = {
  tripDetails: "driverTripDetails",
  navigate: "driverNavigation",
  pod: "driverPod",
  whatsapp: "driverWhatsappUpdates",
};

/** /drivers, /hi/drivers, /ta/drivers. */
export async function DriversPage({ locale }: { locale: Locale }) {
  const content = getContent(locale);
  const d = content.drivers;
  const qr = await qrSvg(env.NEXT_PUBLIC_PLAY_STORE_URL);
  const screens = (Object.keys(d.screens) as (keyof typeof d.screens)[]).filter((key) =>
    isShown(screenFeatures[key] as FeatureKey),
  );

  return (
    <>
      <PageHero
        eyebrow={d.hero.eyebrow}
        title={d.hero.title}
        lead={d.hero.lead}
        actions={<AppBadges locale={locale} />}
        aside={
          <figure className="hidden justify-items-center gap-3 rounded-2xl border bg-surface p-6 lg:grid">
            <div
              role="img"
              aria-label={d.hero.qrAlt}
              className="size-48 [&_svg]:size-full"
              // Generated at build time from the Play Store URL by the qrcode library.
              dangerouslySetInnerHTML={{ __html: qr }}
            />
            <figcaption className="font-semibold">{d.hero.qrTitle}</figcaption>
          </figure>
        }
      />

      <Section labelledBy="app-title" tone="muted">
        <SectionHeading id="app-title" title={d.appTitle} />
        <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {screens.map((key, index) => (
            <li
              key={key}
              className="grid content-start gap-3 rounded-[1.75rem] border-4 border-foreground bg-surface p-4"
            >
              <span className="flex items-center justify-between text-sm text-muted-foreground">
                <span aria-hidden="true" className="font-bold">
                  {index + 1}
                </span>
                {featureStatus[screenFeatures[key] as FeatureKey] === "unconfirmed" ? (
                  <MissingFact what={`confirm driver app "${key}" (NFC-16)`} />
                ) : null}
              </span>
              <span
                aria-hidden="true"
                className="grid aspect-square place-items-center rounded-xl bg-primary-soft text-primary-soft-foreground [&_svg]:size-12"
              >
                {screenIcons[key]}
              </span>
              <h3 className="text-lg font-bold">{d.screens[key].title}</h3>
              <p className="text-muted-foreground">{d.screens[key].body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section labelledBy="built-title">
        <SectionHeading id="built-title" title={d.builtFor.title} />
        <ul className="grid gap-4 md:grid-cols-3">
          {d.builtFor.items.map((item, index) => (
            <li key={item.title} className="flex gap-4 rounded-xl border bg-surface p-5">
              <span
                aria-hidden="true"
                className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary-soft-foreground [&_svg]:size-5"
              >
                {[<Smartphone key="a" />, <Signal key="b" />, <TouchpadOff key="c" />][index]}
              </span>
              <span className="grid content-start gap-1">
                <h3 className="text-lg font-bold">{item.title}</h3>
                <span className="text-muted-foreground">{item.body}</span>
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section labelledBy="rewards-title" id="rewards" tone="muted">
        <div className="flex flex-wrap items-center gap-3">
          <SectionHeading id="rewards-title" title={d.rewards.title} />
          <Badge variant="info">{d.rewards.badge}</Badge>
        </div>
        <p className="max-w-prose text-lg">{d.rewards.body}</p>
        <div className="max-w-3xl rounded-2xl border bg-surface p-4 md:p-6">
          <DriverWaitlistForm
            labels={{ form: d.rewards.form, forms: content.forms, common: content.common }}
            locale={locale}
            privacyHref={routes.privacy.path}
            turnstileSiteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null}
          />
        </div>
      </Section>

      <PageFaq faqs={content.pageFaqs.drivers} title={content.common.faqTitle} />

      <FinalCta
        title={d.final.title}
        body={d.final.body}
        actions={<AppBadges tone="brand" locale={locale} />}
      />
    </>
  );
}
