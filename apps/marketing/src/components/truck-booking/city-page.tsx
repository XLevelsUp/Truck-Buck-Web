import Link from "next/link";

import { Badge } from "@truckbuck/ui/badge";
import { TruckCard } from "@truckbuck/ui/truck-card";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { EstimateWidget } from "@/components/estimate/estimate-widget";
import { widgetProps } from "@/components/estimate/widget-props";
import { JsonLd, PageFaq } from "@/components/page/page-blocks";
import { Section, SectionHeading } from "@/components/page/section";
import { TruckCardMedia } from "@/components/trucks/truck-media";
import { getContent } from "@/content";
import { fill, trimNumber } from "@/lib/format";
import { graph, service } from "@/lib/jsonld";
import { AREA_PREFIX } from "@/server/geo";
import type { CityFacts } from "@/server/lane-facts";

/** "A, B and C" */
function listOf(items: readonly string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

/** The city page's FAQ, built from its data (so it differs city to city). */
export function cityFaqs(facts: CityFacts) {
  const f = getContent().truckBooking.city.faq;
  const city = facts.area.name;
  const faqs: { question: string; answer: string }[] = [];
  if (facts.trucks.length) {
    faqs.push({
      question: fill(f.trucksQ, { city }),
      answer: fill(f.trucksA, { list: listOf(facts.trucks.map((t) => t.name)) }),
    });
  }
  if (facts.lanes.length) {
    faqs.push({
      question: fill(f.routesQ, { city }),
      answer: fill(f.routesA, {
        list: listOf(facts.lanes.map((l) => `${l.from.name} to ${l.to.name}`)),
      }),
    });
  }
  faqs.push({ question: fill(f.priceQ, { city }), answer: f.priceA });
  if (facts.nearby.length) {
    faqs.push({
      question: fill(f.nearbyQ, { city }),
      answer: fill(f.nearbyA, { list: listOf(facts.nearby.map((n) => n.area.name)) }),
    });
  }
  return faqs;
}

/**
 * /truck-booking/<city>: prefilled fare widget, routes from the city, truck
 * types, industries (only when reviewed with a source), nearby served
 * cities and a data-built FAQ.
 */
export function CityPage({ facts }: { facts: CityFacts }) {
  const content = getContent();
  const t = content.truckBooking;
  const c = t.city;
  const { area } = facts;
  const city = area.name;
  const { labels, config } = widgetProps(facts.trucks);
  const sorted = [...facts.trucks].sort((a, b) => a.payloadTonnes - b.payloadTonnes);
  const path = `/truck-booking/${area.slug}`;
  const industries = area.factsReviewed ? area.industries : [];

  return (
    <>
      <JsonLd data={graph(service({ name: fill(c.title, { city }), path, areas: [area] }))} />
      <section aria-labelledby="page-title" className="border-b bg-background">
        <div className="mx-auto grid max-w-(--container-content) gap-8 page-gutter py-8 md:py-12 lg:grid-cols-[1fr_minmax(0,30rem)] lg:gap-12">
          <div className="grid content-start gap-4">
            <Breadcrumbs
              trail={[
                { name: t.breadcrumb, path: "/truck-booking" },
                { name: fill(c.title, { city }), path },
              ]}
            />
            <p className="text-sm font-semibold tracking-wide text-link uppercase">
              {fill(c.eyebrow, { state: area.state })}
            </p>
            <h1 id="page-title" className="text-5xl font-extrabold text-balance">
              {fill(c.title, { city })}
            </h1>
            <p className="max-w-prose text-lg text-muted-foreground">{fill(c.lead, { city })}</p>
            {!facts.indexable ? (
              <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="warning">{content.common.sample}</Badge> {t.sampleNotice}
              </p>
            ) : null}
          </div>
          <div
            id="get-price"
            className="scroll-mt-20 rounded-2xl border bg-surface p-4 shadow-lg md:p-6"
          >
            <h2 className="mb-4 text-xl font-bold">{fill(c.widgetTitle, { city })}</h2>
            <EstimateWidget
              labels={labels}
              config={config}
              prefill={{
                from: { placeId: `${AREA_PREFIX}${area.slug}`, label: `${city}, ${area.state}` },
              }}
            />
          </div>
        </div>
      </section>

      {facts.lanes.length > 0 ? (
        <Section labelledBy="routes-title">
          <SectionHeading
            id="routes-title"
            title={fill(c.routesTitle, { city })}
            lead={fill(c.routesLead, { city })}
          />
          <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {facts.lanes.map((lane) => (
              <li key={lane.slug}>
                <Link
                  href={`/truck-booking/${lane.slug}`}
                  className="flex min-h-14 items-center rounded-xl border bg-surface px-4 font-semibold focus-ring hover:bg-surface-muted"
                >
                  {fill(c.routeLink, { from: lane.from.name, to: lane.to.name })}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {sorted.length > 0 ? (
        <Section labelledBy="city-trucks-title" tone="muted">
          <SectionHeading
            id="city-trucks-title"
            title={fill(c.trucksTitle, { city })}
            lead={fill(c.trucksLead, {
              count: sorted.length,
              smallest: sorted[0]!.name,
              largest: sorted.at(-1)!.name,
            })}
          />
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {sorted.map((truck) => (
              <li key={truck.slug}>
                <TruckCard
                  className="h-full"
                  name={truck.name}
                  media={
                    <TruckCardMedia
                      iconKey={truck.iconKey}
                      imageUrl={truck.imageUrl}
                      imageAlt={truck.imageAlt}
                    />
                  }
                  summary={truck.goodFor}
                  specs={[
                    {
                      label: content.home.trucks.payload,
                      value: fill(content.home.trucks.tonnes, {
                        value: trimNumber(truck.payloadTonnes),
                      }),
                    },
                    {
                      label: content.home.trucks.length,
                      value: fill(content.home.trucks.feet, { value: trimNumber(truck.lengthFt) }),
                    },
                  ]}
                  action={
                    <Link
                      href={`/trucks/${truck.slug}`}
                      className="rounded-sm text-link underline underline-offset-4 focus-ring"
                    >
                      {content.home.trucks.cta}
                      <span className="sr-only">: {truck.name}</span>
                    </Link>
                  }
                />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {industries.length > 0 ? (
        <Section labelledBy="industries-title">
          <SectionHeading id="industries-title" title={fill(c.industriesTitle, { city })} />
          <ul className="flex flex-wrap gap-2">
            {industries.map((industry) => (
              <li key={industry} className="rounded-full border bg-surface px-4 py-2 font-medium">
                {industry}
              </li>
            ))}
          </ul>
          {area.factsSource ? (
            <p className="text-sm text-muted-foreground">
              {fill(c.industriesSource, { source: area.factsSource })}
            </p>
          ) : null}
        </Section>
      ) : null}

      <PageFaq faqs={cityFaqs(facts)} title={fill(c.faqTitle, { city })} />

      {facts.nearby.length > 0 ? (
        <Section labelledBy="nearby-title" tone="muted">
          <h2 id="nearby-title" className="text-2xl font-bold">
            {c.nearbyTitle}
          </h2>
          <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {facts.nearby.map(({ area: near, km }) => (
              <li key={near.slug}>
                <Link
                  href={`/truck-booking/${near.slug}`}
                  className="grid min-h-14 content-center rounded-xl border bg-surface px-4 py-2 focus-ring hover:bg-surface-muted"
                >
                  <span className="font-semibold">
                    {fill(t.route.cityLink, { city: near.name })}
                  </span>
                  <span className="text-sm text-muted-foreground">{fill(c.nearbyKm, { km })}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </>
  );
}
