import type { Metadata } from "next";

import { widgetProps } from "@/components/estimate/widget-props";
import { Coverage } from "@/components/home/coverage";
import { HomeFaq, SocialProof } from "@/components/home/faq-and-proof";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { Audiences, Comparison, FinalCta, TrustStrip } from "@/components/home/sections";
import { TruckCarousel } from "@/components/home/truck-carousel";
import { getContent } from "@/content";
import { htmlLang, type Locale, localizedHref } from "@/i18n/locales";
import { indexableLocales } from "@/i18n/publishing";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { getCatalog, getFaqs, getSocialProof } from "@/server/catalog";

/**
 * hreflang alternates for a page that exists in every locale: reviewed
 * translations only. With English alone there is nothing to alternate
 * between, so no hreflang links are emitted.
 */
export function languageAlternates(path: `/${string}`) {
  const indexable = indexableLocales();
  if (indexable.length < 2) return undefined;
  return {
    ...Object.fromEntries(indexable.map((l) => [htmlLang[l], localizedHref(l, path)])),
    "x-default": path,
  };
}

export function homeMetadata(locale: Locale): Metadata {
  const content = getContent(locale);
  const base = pageMetadata({
    title: content.home.meta.title,
    description: content.site.description,
    path: localizedHref(locale, routes.home.path),
  });
  return {
    ...base,
    // The layout's "%s | TruckBuck" template skips a page in its own segment, so set it here.
    title: { absolute: `${content.site.name} — ${content.home.meta.title}` },
    alternates: { ...base.alternates, languages: languageAlternates(routes.home.path) },
  };
}

/** / , /hi and /ta. */
export async function HomePage({ locale }: { locale: Locale }) {
  const content = getContent(locale);
  const [catalog, dbFaqs, social] = await Promise.all([
    getCatalog(),
    // English FAQs are ops-editable in Supabase; translations come from reviewed content keys.
    locale === "en" ? getFaqs("home") : Promise.resolve(null),
    getSocialProof(),
  ]);
  const faqs = dbFaqs && dbFaqs.length > 0 ? dbFaqs : content.pageFaqs.home;
  const { labels, config } = widgetProps(catalog.trucks, locale);

  return (
    <>
      <Hero labels={labels} config={config} locale={locale} />
      <TrustStrip locale={locale} />
      <HowItWorks locale={locale} />
      <TruckCarousel trucks={catalog.trucks} locale={locale} />
      <Audiences locale={locale} />
      <Comparison locale={locale} />
      <Coverage
        areas={catalog.areas}
        lanes={catalog.lanes}
        isSample={catalog.usesSampleData}
        locale={locale}
      />
      <SocialProof testimonials={social.testimonials} logos={social.logos} locale={locale} />
      <HomeFaq faqs={faqs} locale={locale} />
      <FinalCta locale={locale} />
    </>
  );
}
