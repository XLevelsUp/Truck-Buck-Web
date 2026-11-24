import "../globals.css";

import type { Metadata, Viewport } from "next";

import { baseMetadata, SiteShell, siteViewport } from "@/components/site-shell";
import { isPrefixedLocale, prefixedLocales } from "@/i18n/locales";

/** Root layout for translated pages: /hi/… and /ta/… (own <html lang>). */
export function generateStaticParams() {
  return prefixedLocales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  return isPrefixedLocale(locale) ? baseMetadata(locale) : {};
}

export const viewport: Viewport = siteViewport;

export default async function LocaleRootLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  // An unknown prefix (/fr/…) renders the English shell; the page then calls
  // notFound() so our 404 UI shows inside it (a layout-level notFound() would
  // bypass every not-found file).
  return <SiteShell locale={isPrefixedLocale(locale) ? locale : "en"}>{children}</SiteShell>;
}
