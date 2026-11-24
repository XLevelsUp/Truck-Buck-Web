import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { fontVariables } from "@/app/fonts";
import { getContent } from "@/content";
import { env } from "@/env";
import { htmlLang, type Locale, ogLocale, translationReview } from "@/i18n/locales";
import { publishedLocales } from "@/i18n/publishing";
import { brandTheme } from "@/lib/brand";
import { heroCopy } from "@/lib/experiments";
import { getPriceHrefFor, routes } from "@/lib/routes";
import { whatsappUrl } from "@/lib/whatsapp";

import { BottomBar } from "./bottom-bar";
import { OrganizationJsonLd } from "./json-ld";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

/** Metadata shared by every root layout, localised. */
export function baseMetadata(locale: Locale): Metadata {
  const content = getContent(locale);
  return {
    metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
    title: {
      default: `${content.site.name} — ${content.site.tagline}`,
      template: `%s | ${content.site.name}`,
    },
    description: content.site.description,
    applicationName: content.site.name,
    openGraph: {
      type: "website",
      siteName: content.site.name,
      locale: ogLocale[locale],
    },
    twitter: { card: "summary_large_image" },
    formatDetection: { telephone: false },
    // Search Console / Bing Webmaster verification, only when the tokens are set.
    ...(env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? {
          verification: {
            ...(env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
              ? { google: env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
              : {}),
            ...(env.NEXT_PUBLIC_BING_SITE_VERIFICATION
              ? { other: { "msvalidate.01": env.NEXT_PUBLIC_BING_SITE_VERIFICATION } }
              : {}),
          },
        }
      : {}),
    // Draft translations are previewable but never indexed (NFC-22).
    ...(locale !== "en" && !translationReview[locale].reviewed
      ? { robots: { index: false, follow: false } }
      : {}),
    icons: {
      icon: [
        { url: "/brand/favicon.svg", type: "image/svg+xml" },
        { url: "/brand/icon-32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
  };
}

export const siteViewport: Viewport = {
  themeColor: brandTheme.themeColor,
  width: "device-width",
  initialScale: 1,
};

/**
 * <html>/<body> and the chrome every page shares. Each root layout ((en),
 * [locale]) renders this with its own locale so <html lang> is correct.
 */
export function SiteShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  const content = getContent(locale);
  const available = publishedLocales();
  // Only reachable in preview (production hides unreviewed locales); says so on the page.
  const draft = locale !== "en" && !translationReview[locale].reviewed;
  return (
    <html lang={htmlLang[locale]} className={fontVariables}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-skip-link focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:font-semibold"
        >
          {content.nav.skipToContent}
        </a>
        <SiteHeader locale={locale} availableLocales={available} />
        <main id="main" className="flex-1">
          {draft ? (
            <p
              role="note"
              data-testid="translation-draft"
              className="border-b bg-warning-soft px-4 py-2 text-center text-sm text-warning-soft-foreground"
            >
              {content.common.reviewNotice}
            </p>
          ) : null}
          {children}
        </main>
        <SiteFooter locale={locale} availableLocales={available} />
        <BottomBar
          primary={{
            href: getPriceHrefFor(locale),
            label: content.cta.getPriceShort,
            targetId: "get-price",
          }}
          overrides={{
            [routes.transporters.path]: {
              href: "#apply",
              label: heroCopy("transporters", locale).cta,
              targetId: "apply",
            },
            [routes.drivers.path]: {
              href: env.NEXT_PUBLIC_PLAY_STORE_URL,
              label: content.drivers.final.title,
              targetId: "page-title",
            },
          }}
          whatsappHref={whatsappUrl(content.whatsapp.general)}
          whatsappLabel={content.cta.whatsapp}
          label={content.nav.quickActions}
        />
        <OrganizationJsonLd />
      </body>
    </html>
  );
}
