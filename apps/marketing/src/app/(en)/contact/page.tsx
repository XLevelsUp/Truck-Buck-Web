import type { Metadata } from "next";
import { Mail, MessageCircle, Phone } from "lucide-react";

import { Button } from "@truckbuck/ui/button";
import { formatIndianMobile } from "@truckbuck/utils";

import { OfficeMap } from "@/components/contact/office-map";
import { SupportForm } from "@/components/forms/support-form";
import { MissingFact } from "@/components/missing-fact";
import { PageHero } from "@/components/page/page-blocks";
import { Section, SectionHeading } from "@/components/page/section";
import { getContent } from "@/content";
import { company } from "@/content/company";
import { env } from "@/env";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { whatsappUrl } from "@/lib/whatsapp";

const content = getContent();
const c = content.contact;

export const metadata: Metadata = pageMetadata({
  title: c.meta.title,
  description: c.meta.description,
  path: routes.contact.path,
});

const lineKeys = ["shippers", "transporters", "press"] as const;

/** A phone or email link, or a missing-fact marker (development) / nothing (production). */
function ContactValue({
  kind,
  value,
  line,
}: {
  kind: "phone" | "email";
  value: string | null;
  line: (typeof lineKeys)[number];
}) {
  const label = kind === "phone" ? c.phone : c.email;
  if (!value) {
    return (
      <li>
        <MissingFact what={`${line} ${kind} line (NFC-6)`} />
      </li>
    );
  }
  const shown = kind === "phone" ? (formatIndianMobile(value) ?? value) : value;
  return (
    <li className="flex items-center gap-2">
      {kind === "phone" ? (
        <Phone aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      ) : (
        <Mail aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      )}
      <a
        href={kind === "phone" ? `tel:${value}` : `mailto:${value}`}
        className="rounded-sm text-link underline underline-offset-2 focus-ring"
      >
        <span className="sr-only">{label}: </span>
        {shown}
      </a>
    </li>
  );
}

/**
 * /contact — the form always works (it files a lead). Phone lines, emails,
 * hours and the office address appear only once supplied (NFC-4, NFC-6,
 * NFC-7, NFC-12); WhatsApp only when NEXT_PUBLIC_WHATSAPP_NUMBER is set.
 */
export default function ContactPage() {
  const whatsapp = whatsappUrl(content.whatsapp.general);
  const dev = process.env.NODE_ENV !== "production";
  return (
    <>
      <PageHero eyebrow={c.hero.eyebrow} title={c.hero.title} lead={c.hero.lead} />

      <Section labelledBy="lines-title">
        <SectionHeading id="lines-title" title={c.linesTitle} />
        <ul className="grid gap-4 md:grid-cols-3">
          {lineKeys.map((key) => {
            const line = company.contactLines[key];
            const known = Boolean(line.phone || line.email);
            return (
              <li key={key} className="grid content-start gap-2 rounded-xl border bg-surface p-5">
                <h3 className="text-lg font-bold">{c.lines[key].title}</h3>
                <p className="text-muted-foreground">{c.lines[key].body}</p>
                {known || dev ? (
                  <ul className="grid gap-1.5">
                    <ContactValue kind="phone" value={line.phone} line={key} />
                    <ContactValue kind="email" value={line.email} line={key} />
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>

        <div className="grid gap-4 md:grid-cols-2">
          {whatsapp ? (
            <div className="grid content-start gap-3 rounded-xl border bg-surface p-5">
              <h3 className="text-lg font-bold">{c.whatsappTitle}</h3>
              <p className="text-muted-foreground">{c.whatsappBody}</p>
              <div>
                <Button asChild variant="secondary">
                  <a href={whatsapp} target="_blank" rel="noopener">
                    <MessageCircle aria-hidden="true" /> {content.cta.chatOnWhatsapp}
                  </a>
                </Button>
              </div>
            </div>
          ) : dev ? (
            <MissingFact what="WhatsApp number (NFC-7)" />
          ) : null}

          {company.supportHours ? (
            <div className="grid content-start gap-1 rounded-xl border bg-surface p-5">
              <h3 className="text-lg font-bold">{c.hours}</h3>
              <p>{company.supportHours}</p>
            </div>
          ) : dev ? (
            <MissingFact what="support hours (NFC-12)" />
          ) : null}
        </div>
      </Section>

      <Section labelledBy="form-title" tone="muted">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
          <div className="grid content-start gap-5 rounded-2xl border bg-surface p-5 md:p-8">
            <SectionHeading id="form-title" title={c.formTitle} lead={c.formLead} />
            <SupportForm
              mode="contact"
              labels={{ support: content.support, forms: content.forms, common: content.common }}
              privacyHref={routes.privacy.path}
              turnstileSiteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null}
            />
          </div>

          {company.registeredAddress || dev ? (
            <div className="grid content-start gap-3">
              <h2 className="text-2xl font-bold">{c.officeTitle}</h2>
              {company.registeredAddress ? (
                <>
                  <address className="not-italic">{company.registeredAddress}</address>
                  <OfficeMap
                    address={company.registeredAddress}
                    embedKey={env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY ?? null}
                    labels={{ map: c.mapLabel, show: c.showMap, open: c.openInMaps }}
                  />
                </>
              ) : (
                <MissingFact what="registered office address (NFC-4)" />
              )}
            </div>
          ) : null}
        </div>
      </Section>
    </>
  );
}
