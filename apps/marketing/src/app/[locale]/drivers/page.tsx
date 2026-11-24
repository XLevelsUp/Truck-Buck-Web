import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { driversMetadata, DriversPage } from "@/components/pages/drivers-page";
import { isPrefixedLocale, prefixedLocales } from "@/i18n/locales";
import { isLocalePublished } from "@/i18n/publishing";

/** /hi/drivers and /ta/drivers — the first translated pages. */
export function generateStaticParams() {
  return prefixedLocales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/drivers">): Promise<Metadata> {
  const { locale } = await params;
  return isPrefixedLocale(locale) ? driversMetadata(locale) : {};
}

export default async function Page({ params }: PageProps<"/[locale]/drivers">) {
  const { locale } = await params;
  if (!isPrefixedLocale(locale) || !isLocalePublished(locale)) notFound();
  return <DriversPage locale={locale} />;
}
