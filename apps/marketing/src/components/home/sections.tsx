import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  Clock,
  FileCheck2,
  ShieldCheck,
  Smartphone,
  Truck,
} from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@truckbuck/ui/button";
import { Card } from "@truckbuck/ui/card";

import { AppBadges } from "@/components/app-badges";
import { MissingFact, type NfcRef } from "@/components/missing-fact";
import { Section, SectionHeading } from "@/components/page/section";
import { getContent } from "@/content";
import { company, isGstRegistered } from "@/content/company";
import { env } from "@/env";
import { type Locale, localizedHref } from "@/i18n/locales";
import { fill } from "@/lib/format";
import { getPriceHrefFor, routes } from "@/lib/routes";

export { Section, SectionHeading };

/* -------------------------------------------------------------------------- */
/* 3. Trust strip — confirmed claims only                                      */
/* -------------------------------------------------------------------------- */

export function TrustStrip({ locale = "en" }: { locale?: Locale }) {
  const { trust } = getContent(locale).home;
  const items: { key: string; icon: ReactNode; text: string | null; missing: NfcRef }[] = [
    {
      key: "vetted",
      icon: <ShieldCheck />,
      text: company.claims.vettedTransporters ? trust.vetted : null,
      missing: "vetting claim (NFC-5)",
    },
    {
      key: "gst",
      icon: <Building2 />,
      text: isGstRegistered() ? trust.gst : null,
      missing: "GSTIN (NFC-4)",
    },
    {
      key: "kyc",
      icon: <BadgeCheck />,
      text: company.claims.kycVerifiedDrivers ? trust.kyc : null,
      missing: "driver KYC claim (NFC-11)",
    },
    {
      key: "pod",
      icon: <FileCheck2 />,
      text: company.claims.podEveryTrip ? trust.pod : null,
      missing: "POD claim (NFC-11)",
    },
    {
      key: "support",
      icon: <Clock />,
      text: company.supportHours ? fill(trust.support, { hours: company.supportHours }) : null,
      missing: "support hours (NFC-12)",
    },
  ];
  return (
    <section aria-label={trust.title} className="border-b bg-surface">
      <ul className="mx-auto flex max-w-(--container-content) flex-wrap items-center gap-x-8 gap-y-3 page-gutter py-5">
        {items.map((item) =>
          item.text ? (
            <li
              key={item.key}
              className="flex items-center gap-2 font-semibold [&_svg]:size-5 [&_svg]:text-primary"
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.text}
            </li>
          ) : process.env.NODE_ENV === "production" ? null : (
            <li key={item.key}>
              <MissingFact what={item.missing} />
            </li>
          ),
        )}
      </ul>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 6. Audience panels                                                          */
/* -------------------------------------------------------------------------- */

export function Audiences({ locale = "en" }: { locale?: Locale }) {
  const content = getContent(locale);
  const a = content.home.audiences;
  const panels = [
    {
      id: "for-shippers",
      icon: <Truck />,
      ...a.shippers,
      action: (
        <Button asChild variant="cta" block>
          <Link href={getPriceHrefFor(locale)}>{a.shippers.cta}</Link>
        </Button>
      ),
    },
    {
      id: "for-transporters",
      icon: <ShieldCheck />,
      ...a.transporters,
      action: (
        <Button asChild variant="primary" block>
          <Link href={`${localizedHref(locale, routes.transporters.path)}#apply`}>
            {a.transporters.cta}
          </Link>
        </Button>
      ),
    },
    {
      id: "for-drivers",
      icon: <Smartphone />,
      ...a.drivers,
      action: (
        <Button asChild variant="secondary" block>
          <a href={env.NEXT_PUBLIC_PLAY_STORE_URL} target="_blank" rel="noopener">
            {a.drivers.cta}
          </a>
        </Button>
      ),
    },
  ];
  return (
    <Section labelledBy="audiences-title">
      <SectionHeading id="audiences-title" title={a.title} />
      <ul className="grid gap-4 md:grid-cols-3">
        {panels.map((panel) => (
          <li key={panel.id} id={panel.id} className="scroll-mt-20">
            <Card variant="outline" padding="lg" className="h-full">
              <span
                aria-hidden="true"
                className="grid size-12 place-items-center rounded-xl bg-primary-soft text-primary-soft-foreground [&_svg]:size-6"
              >
                {panel.icon}
              </span>
              <h3 className="text-2xl font-bold">{panel.title}</h3>
              <p className="text-muted-foreground">{panel.body}</p>
              <div className="mt-auto pt-2">{panel.action}</div>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* 7. Broker vs TruckBuck — TruckBuck rows only for confirmed claims           */
/* -------------------------------------------------------------------------- */

export function Comparison({ locale = "en" }: { locale?: Locale }) {
  const c = getContent(locale).home.compare;
  const rows = [
    { key: "price", confirmed: true, missing: "" },
    {
      key: "verification",
      confirmed: company.claims.vettedTransporters,
      missing: "vetting claim (NFC-5)",
    },
    {
      key: "tracking",
      confirmed: company.claims.tripStatusUpdates,
      missing: "trip updates claim (NFC-11)",
    },
    { key: "pod", confirmed: company.claims.podEveryTrip, missing: "POD claim (NFC-11)" },
    {
      key: "invoice",
      confirmed: company.claims.gstInvoice && isGstRegistered(),
      missing: "GST invoice claim (NFC-11)",
    },
  ] as const;
  const visible = rows.filter((row) => row.confirmed || process.env.NODE_ENV !== "production");

  return (
    <Section labelledBy="compare-title" tone="muted">
      <SectionHeading id="compare-title" title={c.title} />
      <div className="overflow-hidden rounded-xl border bg-surface">
        <table className="w-full table-fixed text-left">
          <caption className="sr-only">{c.caption}</caption>
          <thead className="bg-surface-muted text-sm">
            <tr>
              <th scope="col" className="w-[34%] p-3 font-semibold md:p-4">
                <span className="sr-only">{c.feature}</span>
              </th>
              <th scope="col" className="p-3 font-semibold text-muted-foreground md:p-4">
                {c.broker}
              </th>
              <th scope="col" className="p-3 font-bold text-primary md:p-4">
                {c.truckbuck}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {visible.map((row) => {
              const copy = c.rows[row.key];
              return (
                <tr key={row.key} className="align-top">
                  <th scope="row" className="p-3 font-semibold md:p-4">
                    {copy.label}
                  </th>
                  <td className="p-3 text-muted-foreground md:p-4">{copy.broker}</td>
                  <td className="p-3 font-semibold md:p-4">
                    {row.confirmed ? copy.truckbuck : <MissingFact what={row.missing} />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* 11. Final CTA band                                                          */
/* -------------------------------------------------------------------------- */

export function FinalCta({ locale = "en" }: { locale?: Locale }) {
  const content = getContent(locale);
  const f = content.home.final;
  return (
    <section
      aria-labelledby="final-title"
      className="bg-surface-brand text-surface-brand-foreground"
    >
      <div className="mx-auto grid max-w-(--container-content) gap-10 page-gutter py-14 md:grid-cols-2 md:items-center md:py-20">
        <div className="grid gap-4">
          <h2 id="final-title" className="text-4xl font-extrabold">
            {f.title}
          </h2>
          <p className="text-lg">{f.body}</p>
          <div>
            <Button asChild variant="cta" size="lg">
              <Link href={getPriceHrefFor(locale)}>{content.cta.getPrice}</Link>
            </Button>
          </div>
        </div>
        <div className="grid gap-3 md:justify-self-end">
          <h3 className="text-xl font-bold">{f.appTitle}</h3>
          <p>{f.appBody}</p>
          <AppBadges tone="brand" locale={locale} />
        </div>
      </div>
    </section>
  );
}
