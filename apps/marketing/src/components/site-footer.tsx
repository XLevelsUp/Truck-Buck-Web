import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@truckbuck/ui/logo";
import { formatIndianMobile } from "@truckbuck/utils";

import { getContent } from "@/content";
import { company } from "@/content/company";
import { env } from "@/env";
import { isLocalizedPath, type Locale, localizedHref } from "@/i18n/locales";
import { getPriceHrefFor, primaryNav, routes } from "@/lib/routes";
import { whatsappUrl } from "@/lib/whatsapp";

import { CookieSettingsButton } from "./analytics";
import { AppBadges } from "./app-badges";
import { LanguageSwitcher } from "./language-switcher";
import { MissingFact, type NfcRef } from "./missing-fact";

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid content-start gap-3">
      <h2 className="text-sm font-bold tracking-wide uppercase">{title}</h2>
      <ul className="grid gap-2 text-muted-foreground">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <li>
      <Link href={href} className="rounded-sm focus-ring hover:text-foreground hover:underline">
        {children}
      </Link>
    </li>
  );
}

/** Fact line: shows the value, or a missing-fact marker in dev (nothing in production). */
function Fact({ label, value, missing }: { label: string; value: string | null; missing: NfcRef }) {
  return (
    <li>
      {value ? (
        <>
          <span className="text-foreground">{label}:</span> {value}
        </>
      ) : (
        <MissingFact what={missing} />
      )}
    </li>
  );
}

export function SiteFooter({
  locale = "en",
  availableLocales = ["en"],
}: {
  locale?: Locale;
  availableLocales?: Locale[];
}) {
  const content = getContent(locale);
  const whatsapp = whatsappUrl(content.whatsapp.general);
  const phone = company.supportPhone ? formatIndianMobile(company.supportPhone) : null;
  const year = 2026;

  return (
    <footer className="border-t bg-surface pb-20 md:pb-0">
      <div className="mx-auto grid max-w-(--container-content) gap-10 page-gutter py-12 md:grid-cols-3 lg:grid-cols-5">
        <FooterColumn title={content.company.forBusinessTitle}>
          <FooterLink href={getPriceHrefFor(locale)}>{content.cta.getPrice}</FooterLink>
          {primaryNav
            .filter((item) => item.key === "shippers" || item.key === "pricing")
            .map((item) => (
              <FooterLink key={item.key} href={item.href}>
                {content.nav[item.key]}
              </FooterLink>
            ))}
        </FooterColumn>

        <FooterColumn title={content.company.partnersTitle}>
          {primaryNav
            .filter((item) => item.key === "transporters" || item.key === "drivers")
            .map((item) => (
              <FooterLink
                key={item.key}
                href={isLocalizedPath(item.href) ? localizedHref(locale, item.href) : item.href}
              >
                {content.nav[item.key]}
              </FooterLink>
            ))}
          <li className="pt-2">
            <AppBadges locale={locale} />
          </li>
        </FooterColumn>

        <FooterColumn title={content.company.companyTitle}>
          <FooterLink href={routes.about.path}>{content.nav.about}</FooterLink>
          <FooterLink href={routes.safety.path}>{content.nav.safety}</FooterLink>
          <FooterLink href={routes.help.path}>{content.nav.help}</FooterLink>
          <FooterLink href={routes.contact.path}>{content.nav.contact}</FooterLink>
        </FooterColumn>

        <FooterColumn title={content.company.contactTitle}>
          <li>
            {phone ? (
              <a
                href={`tel:${company.supportPhone}`}
                className="rounded-sm focus-ring hover:underline"
              >
                {content.company.phone}: {phone}
              </a>
            ) : (
              <MissingFact what="support phone (NFC-6)" />
            )}
          </li>
          <li>
            {company.supportEmail ? (
              <a
                href={`mailto:${company.supportEmail}`}
                className="rounded-sm focus-ring hover:underline"
              >
                {content.company.email}: {company.supportEmail}
              </a>
            ) : (
              <MissingFact what="support email (NFC-6)" />
            )}
          </li>
          <li>
            {whatsapp ? (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener"
                className="rounded-sm focus-ring hover:underline"
              >
                {content.company.whatsapp}
              </a>
            ) : (
              <MissingFact what="WhatsApp number (NFC-7)" />
            )}
          </li>
          <Fact
            label={content.company.hours}
            value={company.supportHours}
            missing="support hours (NFC-12)"
          />
          {company.social.length > 0 ? (
            company.social.map((s) => (
              <FooterLink key={s.href} href={s.href}>
                {s.label}
              </FooterLink>
            ))
          ) : (
            <li>
              <MissingFact what="social links (NFC-14)" />
            </li>
          )}
        </FooterColumn>

        <FooterColumn title={content.company.legalTitle}>
          <FooterLink href={routes.privacy.path}>{content.nav.privacy}</FooterLink>
          <FooterLink href={routes.terms.path}>{content.nav.terms}</FooterLink>
          <FooterLink href={routes.refundPolicy.path}>{content.nav.refund}</FooterLink>
          <FooterLink href={routes.grievance.path}>{content.nav.grievance}</FooterLink>
          {env.NEXT_PUBLIC_GTM_ID ? (
            <li>
              <CookieSettingsButton label={content.consent.settings} />
            </li>
          ) : null}
        </FooterColumn>
      </div>

      <div className="border-t">
        <div className="mx-auto grid max-w-(--container-content) gap-4 page-gutter py-6 text-sm text-muted-foreground md:grid-cols-[auto_1fr] md:items-start md:gap-8">
          <div className="grid content-start gap-4">
            <Logo title="" className="h-6" />
            <LanguageSwitcher
              current={locale}
              available={availableLocales}
              label={content.common.languageLabelFooter}
            />
          </div>
          <ul className="grid gap-1">
            <Fact
              label={content.site.name}
              value={company.legalName}
              missing="registered legal name (NFC-4)"
            />
            <Fact
              label={content.company.address}
              value={company.registeredAddress}
              missing="registered office (NFC-4)"
            />
            <Fact label={content.company.cin} value={company.cin} missing="CIN (NFC-4)" />
            <Fact label={content.company.gstin} value={company.gstin} missing="GSTIN (NFC-4)" />
            <li>
              © {year} {company.legalName ?? content.site.name}. {content.footer.rights}
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
