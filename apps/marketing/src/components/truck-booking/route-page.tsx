import Link from "next/link";

import { Badge } from "@truckbuck/ui/badge";
import { formatINR } from "@truckbuck/utils";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { EstimateWidget } from "@/components/estimate/estimate-widget";
import { widgetProps } from "@/components/estimate/widget-props";
import { JsonLd } from "@/components/page/page-blocks";
import { Section, SectionHeading } from "@/components/page/section";
import { getContent } from "@/content";
import { fill, trimNumber } from "@/lib/format";
import { graph, service } from "@/lib/jsonld";
import { routes } from "@/lib/routes";
import { AREA_PREFIX, haversineKm } from "@/server/geo";
import type { RouteFacts } from "@/server/lane-facts";

const rupees = (paise: number) => formatINR(paise, { wholeRupees: true });

/** Fares and transit sorted from the smallest truck to the largest. */
function byPayload(facts: RouteFacts) {
  return [...facts.fares].sort((a, b) => a.truck.payloadTonnes - b.truck.payloadTonnes);
}

/** Lead sentence and meta description share these numbers. */
export function routeSummary(facts: RouteFacts) {
  const fares = byPayload(facts);
  const cheapest = [...facts.fares].sort((a, b) => a.minPaise - b.minPaise)[0] ?? null;
  return {
    km: Math.round(facts.route.distanceKm),
    cheapest,
    fares,
    lowPaise: cheapest?.minPaise ?? null,
    highPaise: fares.length ? Math.max(...fares.map((f) => f.maxPaise)) : null,
  };
}

/**
 * /truck-booking/<from>-to-<to>. Every sentence is computed from this lane's
 * data (distance, fares per truck, transit, states, lane facts), so no two
 * pages read the same. Sections without data are left out.
 */
export function RoutePage({ facts }: { facts: RouteFacts }) {
  const content = getContent();
  const t = content.truckBooking;
  const r = t.route;
  const { from, to } = facts;
  const names = { from: from.name, to: to.name };
  const { km, cheapest, fares, lowPaise, highPaise } = routeSummary(facts);
  // Great-circle distance between the two city centres.
  const straightKm = Math.round(haversineKm(from, to));
  const small = fares[0];
  const large = fares.at(-1);
  const { labels, config } = widgetProps(facts.fares.map((f) => f.truck));
  const path = `/truck-booking/${facts.slug}`;
  const gst = facts.gstPct === null ? "" : trimNumber(facts.gstPct);

  return (
    <>
      <JsonLd
        data={graph(
          service({
            name: fill(r.title, names),
            path,
            areas: [from, to],
            lowPricePaise: facts.indexable ? lowPaise : null,
            highPricePaise: facts.indexable ? highPaise : null,
          }),
        )}
      />
      <section aria-labelledby="page-title" className="border-b bg-background">
        <div className="mx-auto grid max-w-(--container-content) gap-8 page-gutter py-8 md:py-12 lg:grid-cols-[1fr_minmax(0,30rem)] lg:gap-12">
          <div className="grid content-start gap-4">
            <Breadcrumbs
              trail={[
                { name: t.breadcrumb, path: "/truck-booking" },
                {
                  name: fill(r.cityLink, { city: from.name }),
                  path: `/truck-booking/${from.slug}`,
                },
                { name: fill(r.title, names), path },
              ]}
            />
            <p className="text-sm font-semibold tracking-wide text-link uppercase">
              {fill(r.eyebrow, { fromState: from.state, toState: to.state })}
            </p>
            <h1 id="page-title" className="text-5xl font-extrabold text-balance">
              {fill(r.title, names)}
            </h1>
            <p className="max-w-prose text-lg text-muted-foreground">
              {cheapest
                ? fill(r.lead, { km, fare: rupees(cheapest.minPaise), truck: cheapest.truck.name })
                : fill(r.leadNoFare, { km })}
            </p>
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
            <h2 className="mb-4 text-xl font-bold">{r.widgetTitle}</h2>
            <EstimateWidget
              labels={labels}
              config={config}
              prefill={{
                from: {
                  placeId: `${AREA_PREFIX}${from.slug}`,
                  label: `${from.name}, ${from.state}`,
                },
                to: { placeId: `${AREA_PREFIX}${to.slug}`, label: `${to.name}, ${to.state}` },
              }}
            />
          </div>
        </div>
      </section>

      <Section labelledBy="facts-title">
        <SectionHeading id="facts-title" title={fill(r.factsTitle, names)} />
        <dl className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            [r.facts.distance, fill(r.facts.distanceValue, { km })],
            [r.facts.straightLine, fill(r.facts.distanceValue, { km: straightKm })],
            ...(small
              ? [
                  [
                    r.facts.transit,
                    fill(r.facts.transitValue, {
                      min: small.transitHours.min,
                      max: small.transitHours.max,
                      truck: small.truck.name,
                    }),
                  ],
                ]
              : []),
            ...(cheapest ? [[r.facts.fareFrom, rupees(cheapest.minPaise)]] : []),
            ...(facts.lane.factsReviewed && facts.lane.highways.length
              ? [[r.facts.highways, facts.lane.highways.join(", ")]]
              : []),
            [r.facts.trucks, String(facts.fares.length)],
          ].map(([label, value]) => (
            <div key={label} className="grid gap-1 rounded-xl border bg-surface p-4">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="text-xl font-bold">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="grid max-w-prose gap-3">
          <h2 className="text-2xl font-bold">{r.aboutTitle}</h2>
          <p>
            {fill(r.about.distance, {
              ...names,
              km,
              crow: straightKm,
              ratio: trimNumber(km / Math.max(1, straightKm)),
            })}{" "}
            {from.state === to.state
              ? fill(r.about.sameState, { state: from.state })
              : fill(r.about.crossState, { fromState: from.state, toState: to.state })}
          </p>
          {small && large && small !== large ? (
            <p>
              {fill(r.about.transit, {
                small: small.truck.name,
                smallMin: small.transitHours.min,
                smallMax: small.transitHours.max,
                large: large.truck.name,
                largeMin: large.transitHours.min,
                largeMax: large.transitHours.max,
              })}{" "}
              {lowPaise !== null && highPaise !== null
                ? fill(r.about.fares, {
                    count: facts.fares.length,
                    low: rupees(lowPaise),
                    high: rupees(highPaise),
                    gst,
                  })
                : null}
            </p>
          ) : null}
        </div>
      </Section>

      {fares.length > 0 ? (
        <Section labelledBy="fares-title" tone="muted">
          <SectionHeading id="fares-title" title={fill(r.fareTitle, names)} />
          <div className="overflow-x-auto rounded-xl border bg-surface">
            <table className="w-full min-w-[32rem] text-left">
              <caption className="sr-only">{fill(r.fareCaption, names)}</caption>
              <thead className="bg-surface-muted text-sm">
                <tr>
                  <th scope="col" className="p-3">
                    {r.fareColumns.truck}
                  </th>
                  <th scope="col" className="p-3">
                    {r.fareColumns.payload}
                  </th>
                  <th scope="col" className="p-3">
                    {r.fareColumns.fare}
                  </th>
                  <th scope="col" className="p-3">
                    {r.fareColumns.transit}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {fares.map((fare) => (
                  <tr key={fare.truck.slug}>
                    <th scope="row" className="p-3 font-semibold">
                      <Link
                        href={`/trucks/${fare.truck.slug}`}
                        className="rounded-sm text-link underline underline-offset-2 focus-ring"
                      >
                        {fare.truck.name}
                      </Link>
                    </th>
                    <td className="p-3">
                      {fill(content.home.trucks.tonnes, {
                        value: trimNumber(fare.truck.payloadTonnes),
                      })}
                    </td>
                    <td className="p-3 font-semibold tabular-nums">
                      {rupees(fare.minPaise)} – {rupees(fare.maxPaise)}
                    </td>
                    <td className="p-3">
                      {fill(content.home.result.hours, {
                        min: fare.transitHours.min,
                        max: fare.transitHours.max,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="max-w-prose text-sm text-muted-foreground">{fill(r.fareNote, { gst })}</p>
          {facts.includes.length || facts.excludes.length ? (
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="font-bold">{r.includedTitle}</h3>
                <ul className="mt-2 list-disc pl-5">
                  {facts.includes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-bold">{r.excludedTitle}</h3>
                <ul className="mt-2 list-disc pl-5">
                  {facts.excludes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </Section>
      ) : null}

      {facts.suggestions.length > 0 || (facts.lane.factsReviewed && facts.lane.highways.length) ? (
        <Section labelledBy="lane-title">
          {facts.suggestions.length > 0 ? (
            <div className="grid gap-3">
              <h2 id="lane-title" className="text-2xl font-bold">
                {r.goodsTitle}
              </h2>
              <ul className="grid gap-2">
                {facts.suggestions.map((s) => (
                  <li key={s.goods}>
                    {s.truck
                      ? fill(r.goodsItem, {
                          tonnes: trimNumber(s.tonnes),
                          goods: s.goods,
                          truck: s.truck.name,
                          payload: trimNumber(s.truck.payloadTonnes),
                          length: trimNumber(s.truck.lengthFt),
                        })
                      : fill(r.goodsNone, { tonnes: trimNumber(s.tonnes), goods: s.goods })}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {facts.lane.factsReviewed && facts.lane.highways.length ? (
            <div className="grid gap-2">
              <h2
                id={facts.suggestions.length ? undefined : "lane-title"}
                className="text-2xl font-bold"
              >
                {r.highwaysTitle}
              </h2>
              <p>
                {fill(r.highways, { highways: facts.lane.highways.join(", ") })}{" "}
                {facts.lane.tollNote}
              </p>
              {facts.lane.factsSource ? (
                <p className="text-sm text-muted-foreground">
                  {fill(r.factsSource, { source: facts.lane.factsSource })}
                </p>
              ) : null}
            </div>
          ) : null}
        </Section>
      ) : null}

      <Section labelledBy="links-title" tone="muted">
        <h2 id="links-title" className="text-2xl font-bold">
          {r.relatedTitle}
        </h2>
        <ul className="flex flex-wrap gap-2">
          {[
            ...(facts.reverse
              ? [{ href: `/truck-booking/${facts.reverse}`, label: fill(r.reverseLink, names) }]
              : []),
            { href: `/truck-booking/${from.slug}`, label: fill(r.cityLink, { city: from.name }) },
            { href: `/truck-booking/${to.slug}`, label: fill(r.cityLink, { city: to.name }) },
            ...facts.related.map((link) => ({
              href: `/truck-booking/${link.slug}`,
              label: fill(t.city.routeLink, { from: link.from.name, to: link.to.name }),
            })),
            { href: routes.pricing.path, label: r.pricingLink },
            { href: routes.trucks.path, label: r.trucksLink },
          ].map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="inline-flex min-h-11 items-center rounded-full border bg-surface px-4 font-semibold focus-ring hover:bg-surface-muted"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
