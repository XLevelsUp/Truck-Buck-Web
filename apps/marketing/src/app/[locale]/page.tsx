import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { homeMetadata, HomePage } from "@/components/pages/home-page";
import { isPrefixedLocale, prefixedLocales } from "@/i18n/locales";
import { isLocalePublished } from "@/i18n/publishing";

/** /hi and /ta — served only once reviewed (or on preview builds). */
export function generateStaticParams() {
  return prefixedLocales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  return isPrefixedLocale(locale) ? homeMetadata(locale) : {};
}

export default async function Page({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isPrefixedLocale(locale) || !isLocalePublished(locale)) notFound();
  return <HomePage locale={locale} />;
}
