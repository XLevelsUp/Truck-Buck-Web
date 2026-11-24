import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@truckbuck/ui/badge";
import { Button } from "@truckbuck/ui/button";
import { TruckCard } from "@truckbuck/ui/truck-card";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { EstimateWidget } from "@/components/estimate/estimate-widget";
import { widgetProps } from "@/components/estimate/widget-props";
import { JsonLd, PageFaq } from "@/components/page/page-blocks";
import { Section, SectionHeading } from "@/components/page/section";
import { TruckCardMedia, TruckMedia } from "@/components/trucks/truck-media";
import { truckSpecs } from "@/components/trucks/truck-specs";
import { getContent } from "@/content";
import { env } from "@/env";
import { fill, trimNumber } from "@/lib/format";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { getCatalog } from "@/server/catalog";
import type { TruckType } from "@/server/catalog-types";
import { getMinimumFare } from "@/server/lane-facts";

/** Every catalogue truck is prerendered at build time. */
export async function generateStaticParams() {
  const { trucks } = await getCatalog();
  // Cache Components needs at least one param; an unknown slug renders the 404 UI.
  return trucks.length > 0 ? trucks.map((t) => ({ slug: t.slug })) : [{ slug: "none" }];
}

async function findTruck(slug: string) {
  const { trucks } = await getCatalog();
  return { truck: trucks.find((t) => t.slug === slug) ?? null, trucks };
}

/** Up to three trucks closest in payload, excluding this one. */
function relatedTrucks(truck: TruckType, trucks: TruckType[]): TruckType[] {
  return trucks
    .filter((t) => t.slug !== truck.slug)
    .sort(
      (a, b) =>
        Math.abs(a.payloadTonnes - truck.payloadTonnes) -
        Math.abs(b.payloadTonnes - truck.payloadTonnes),
    )
    .slice(0, 3);
}

export async function generateMetadata({ params }: PageProps<"/trucks/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { truck } = await findTruck(slug);
  if (!truck) return {};
  const t = getContent().home.trucks;
  return {
    ...pageMetadata({
      title: truck.name,
      description:
        `${truck.name}: ${fill(t.tonnes, { value: trimNumber(truck.payloadTonnes) })}, ${fill(t.feet, { value: trimNumber(truck.lengthFt) })}. ${truck.goodFor ?? ""}`.trim(),
      path: `/trucks/${truck.slug}`,
    }),
    // Sample catalogue entries are not indexed.
    ...(truck.isSample ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function TruckPage({ params }: PageProps<"/trucks/[slug]">) {
  const { slug } = await params;
  const { truck, trucks } = await findTruck(slug);
  if (!truck) notFound();

  const content = getContent();
  const p = content.trucksPage;
  const specs = truckSpecs(truck, true);
  const related = relatedTrucks(truck, trucks);
  const { labels, config } = widgetProps(trucks);
  const url = `${env.NEXT_PUBLIC_SITE_URL}/trucks/${truck.slug}`;
  // Product rich results need an offer: only with a real rate card (see getMinimumFare).
  const minimumFare = truck.isSample ? null : await getMinimumFare(truck.slug);

  return (
    <>
      <section aria-labelledby="page-title" className="border-b">
        <div className="mx-auto grid max-w-(--container-content) gap-8 page-gutter py-10 md:grid-cols-2 md:items-start md:py-14">
          <div className="grid content-start gap-4">
            <Breadcrumbs
              trail={[
                { name: content.trucksPage.title, path: routes.trucks.path },
                { name: truck.name, path: `/trucks/${truck.slug}` },
              ]}
            />
            <h1 id="page-title" className="text-5xl font-extrabold">
              {truck.name}
            </h1>
            {truck.goodFor ? (
              <p className="text-lg text-muted-foreground">{truck.goodFor}</p>
            ) : null}
            {truck.isSample ? (
              <p className="flex flex-wrap items-center gap-2 text-muted-foreground">
                <Badge variant="warning">{content.common.sample}</Badge>{" "}
                {content.trucks.sampleNotice}
              </p>
            ) : null}
            <div className="overflow-hidden rounded-xl border">
              <table className="w-full text-left">
                <caption className="sr-only">{p.specsTitle}</caption>
                <tbody className="divide-y">
                  {specs.map((spec) => (
                    <tr key={spec.label}>
                      <th scope="row" className="w-2/5 bg-surface-muted p-3 font-semibold">
                        {spec.label}
                      </th>
                      <td className="p-3">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <TruckMedia
            iconKey={truck.iconKey}
            imageUrl={truck.imageUrl}
            imageAlt={truck.imageAlt}
            sizes="(min-width: 768px) 50vw, 100vw"
            priority
          />
        </div>
      </section>

      {truck.typicalLoads.length > 0 ? (
        <Section labelledBy="goods-title" tone="muted">
          <SectionHeading id="goods-title" title={p.goodsTitle} />
          <ul className="flex flex-wrap gap-2">
            {truck.typicalLoads.map((load) => (
              <li key={load} className="rounded-full border bg-surface px-4 py-2 font-medium">
                {load}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section labelledBy="quote-title">
        <SectionHeading id="quote-title" title={p.quoteTitle} />
        <div
          id="get-price"
          className="max-w-2xl scroll-mt-20 rounded-2xl border bg-surface p-4 shadow-lg md:p-6"
        >
          <EstimateWidget labels={labels} config={config} preselectedTruck={truck.slug} />
        </div>
      </Section>

      {related.length > 0 ? (
        <Section labelledBy="related-title" tone="muted">
          <SectionHeading id="related-title" title={p.relatedTitle} />
          <ul className="grid gap-4 md:grid-cols-3">
            {related.map((other) => (
              <li key={other.slug}>
                <TruckCard
                  className="h-full"
                  name={other.name}
                  media={
                    <TruckCardMedia
                      iconKey={other.iconKey}
                      imageUrl={other.imageUrl}
                      imageAlt={other.imageAlt}
                    />
                  }
                  specs={truckSpecs(other)}
                  action={
                    <Button asChild variant="secondary" block>
                      <Link href={`/trucks/${other.slug}`}>
                        {content.home.trucks.cta}
                        <span className="sr-only">: {other.name}</span>
                      </Link>
                    </Button>
                  }
                />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <PageFaq faqs={content.pageFaqs.trucks} title={content.common.faqTitle} />

      <JsonLd
        data={[
          ...(minimumFare === null
            ? []
            : [
                {
                  "@context": "https://schema.org",
                  "@type": "Product",
                  offers: {
                    "@type": "AggregateOffer",
                    priceCurrency: "INR",
                    lowPrice: Math.round(minimumFare / 100),
                    offerCount: 1,
                  },
                  name: truck.name,
                  description: truck.goodFor ?? undefined,
                  category: "Truck hire (full truck load)",
                  url,
                  ...(truck.imageUrl ? { image: truck.imageUrl } : {}),
                  brand: { "@type": "Brand", name: content.site.name },
                  additionalProperty: specs.map((spec) => ({
                    "@type": "PropertyValue",
                    name: spec.label,
                    value: spec.value,
                  })),
                },
              ]),
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: `${truck.name} — full truck load transport`,
            serviceType: "Full truck load (FTL) freight transport",
            provider: {
              "@type": "Organization",
              name: content.site.name,
              url: env.NEXT_PUBLIC_SITE_URL,
            },
            areaServed: { "@type": "Country", name: "India" },
            url,
          },
        ]}
      />
    </>
  );
}
