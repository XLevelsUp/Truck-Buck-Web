import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { transportersMetadata, TransportersPage } from "@/components/pages/transporters-page";
import { isPrefixedLocale, prefixedLocales } from "@/i18n/locales";
import { isLocalePublished } from "@/i18n/publishing";

export function generateStaticParams() {
  return prefixedLocales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/transporters">): Promise<Metadata> {
  const { locale } = await params;
  return isPrefixedLocale(locale) ? transportersMetadata(locale) : {};
}

export default async function Page({ params }: PageProps<"/[locale]/transporters">) {
  const { locale } = await params;
  if (!isPrefixedLocale(locale) || !isLocalePublished(locale)) notFound();
  return <TransportersPage locale={locale} />;
}
