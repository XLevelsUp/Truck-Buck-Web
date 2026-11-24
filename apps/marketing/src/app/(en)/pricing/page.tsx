import type { Metadata } from "next";
import Link from "next/link";

import { priceQuote, type RateCard } from "@truckbuck/pricing";
import { Badge } from "@truckbuck/ui/badge";
import { Button } from "@truckbuck/ui/button";
import { PriceBreakdown, PriceBreakdownRow } from "@truckbuck/ui/price-breakdown";
import { formatINR } from "@truckbuck/utils";

import { EstimateWidget } from "@/components/estimate/estimate-widget";
import { widgetProps } from "@/components/estimate/widget-props";
import { MissingFact, type NfcRef } from "@/components/missing-fact";
import { FinalCta, PageFaq, PageHero } from "@/components/page/page-blocks";
import { Section, SectionHeading } from "@/components/page/section";
import { getContent } from "@/content";
import { fill } from "@/lib/format";
import { getPriceHref, routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { getCatalog, getRateCard, getSiteConfig } from "@/server/catalog";
import type { TruckType } from "@/server/catalog-types";

const content = getContent();

export const metadata: Metadata = pageMetadata({
  title: content.pricing.meta.title,
  description: content.pricing.meta.description,
  path: routes.pricing.path,
});

const EXAMPLE_KM = 350;
/** Fixed dates keep the example stable between builds: 10:00 IST, pickup two days later. */
const EXAMPLE_NOW = new Date("2026-01-05T04:30:00Z");
const EXAMPLE_PICKUP = new Date("2026-01-07T04:30:00Z");

const rupees = (paise: number) => formatINR(paise, { wholeRupees: true });

/** Per-km bands actually used by a trip of `km` (progressive slabs). */
function bands(card: RateCard, km: number) {
  const rows: { from: number; to: number | null; rate: number; amount: number }[] = [];
  let floor = 0;
  for (const slab of card.kmSlabs) {
    const ceiling = slab.upToKm ?? Number.POSITIVE_INFINITY;
    const kmInBand = Math.min(km, ceiling) - floor;
    if (kmInBand <= 0) break;
    rows.push({
      from: floor + 1,
      to: slab.upToKm === null || km < ceiling ? Math.min(km, ceiling) : slab.upToKm,
      rate: slab.perKmPaise,
      amount: kmInBand * slab.perKmPaise,
    });
    floor = ceiling;
  }
  return rows;
}

async function workedExample(trucks: TruckType[]) {
  const truck = trucks.find((t) => t.slug === "lcv-14ft") ?? trucks[0];
  if (!truck) return null;
  const rate = await getRateCard(truck.slug);
  if (!rate) return null;
  const quote = priceQuote(
    { distanceKm: EXAMPLE_KM, truckType: truck.slug, pickupAt: EXAMPLE_PICKUP, now: EXAMPLE_NOW },
    rate.card,
  );
  return { truck, card: rate.card, sample: rate.isSample, quote };
}

export default async function PricingPage() {
  const p = content.pricing;
  const [catalog, charges] = await Promise.all([getCatalog(), getSiteConfig("shipper.charges")]);
  const example = await workedExample(catalog.trucks);
  const { labels, config } = widgetProps(catalog.trucks);
  const e = p.example;

  return (
    <>
      <PageHero
        eyebrow={p.hero.eyebrow}
        title={p.hero.title}
        lead={p.hero.lead}
        actions={
          <Button asChild variant="cta" size="lg">
            <a href="#get-price">{p.hero.cta}</a>
          </Button>
        }
      />

      <Section labelledBy="formula-title">
        <SectionHeading id="formula-title" title={p.formula.title} />
        <ol className="grid gap-3 md:grid-cols-2">
          {p.formula.parts.map((part, index) => (
            <li key={part.title} className="flex gap-4 rounded-xl border bg-surface p-5">
              <span
                aria-hidden="true"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft font-bold text-primary-soft-foreground"
              >
                {index === 0 ? "=" : "+"}
              </span>
              <span className="grid gap-1">
                <h3 className="text-lg font-bold">{part.title}</h3>
                <span className="text-muted-foreground">{part.body}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="max-w-prose rounded-xl bg-info-soft p-4 text-info-soft-foreground">
          {p.formula.rangeNote}
        </p>
      </Section>

      {example ? (
        <Section labelledBy="example-title" tone="muted">
          <div className="flex flex-wrap items-center gap-3">
            <SectionHeading
              id="example-title"
              title={e.title}
              lead={fill(e.lead, { truck: example.truck.name, km: EXAMPLE_KM })}
            />
            {example.sample ? <Badge variant="warning">{content.home.result.sample}</Badge> : null}
          </div>
          <div className="max-w-xl rounded-2xl border bg-surface p-5 md:p-6">
            <PriceBreakdown>
              <PriceBreakdownRow label={e.base} amountPaise={example.card.baseFarePaise} />
              {bands(example.card, example.quote.chargeableKm).map((band) => (
                <PriceBreakdownRow
                  key={band.from}
                  label={
                    band.to === null
                      ? fill(e.distanceBandOpen, { from: band.from - 1, rate: rupees(band.rate) })
                      : fill(e.distanceBand, {
                          from: band.from,
                          to: band.to,
                          rate: rupees(band.rate),
                        })
                  }
                  amountPaise={band.amount}
                />
              ))}
              {example.quote.lines
                .filter((line) => line.kind === "night" || line.kind === "urgent")
                .map((line) => (
                  <PriceBreakdownRow
                    key={line.kind}
                    label={line.kind === "night" ? e.night : e.urgent}
                    amountPaise={line.amountPaise}
                  />
                ))}
              <PriceBreakdownRow label={e.subtotal} amountPaise={example.quote.subtotalPaise} />
              <PriceBreakdownRow
                label={fill(e.gst, { pct: example.quote.gstPct })}
                amountPaise={Math.round((example.quote.subtotalPaise * example.quote.gstPct) / 100)}
              />
              <PriceBreakdownRow
                kind="total"
                label={e.range}
                valueText={`${rupees(example.quote.fare.minPaise)} – ${rupees(example.quote.fare.maxPaise)}`}
                note={fill(e.rangeNote, {
                  low: example.card.rangeLowPct,
                  high: example.card.rangeHighPct,
                  round: rupees(example.card.roundToPaise),
                })}
              />
            </PriceBreakdown>
          </div>
        </Section>
      ) : process.env.NODE_ENV === "production" ? null : (
        <Section labelledBy="example-title" tone="muted">
          <h2 id="example-title" className="text-3xl font-extrabold">
            {e.title}
          </h2>
          <MissingFact what="worked example needs an approved rate card (NFC-2)" />
        </Section>
      )}

      <Section labelledBy="estimator-title">
        <SectionHeading id="estimator-title" title={p.estimatorTitle} />
        <div
          id="get-price"
          className="max-w-2xl scroll-mt-20 rounded-2xl border bg-surface p-4 shadow-lg md:p-6"
        >
          <EstimateWidget labels={labels} config={config} />
        </div>
      </Section>

      <Section labelledBy="compare-title" tone="muted">
        <SectionHeading id="compare-title" title={p.compare.title} />
        <div className="overflow-hidden rounded-xl border bg-surface">
          <table className="w-full table-fixed text-left">
            <caption className="sr-only">{p.compare.caption}</caption>
            <thead className="bg-surface-muted text-sm">
              <tr>
                <th scope="col" className="w-2/5 p-3 md:p-4">
                  {p.compare.item}
                </th>
                <th scope="col" className="p-3 font-bold text-primary md:p-4">
                  {p.compare.truckbuck}
                </th>
                <th scope="col" className="p-3 text-muted-foreground md:p-4">
                  {p.compare.broker}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {p.compare.rows.map((row) => (
                <tr key={row.item} className="align-top">
                  <th scope="row" className="p-3 font-semibold md:p-4">
                    {row.item}
                  </th>
                  <td className="p-3 font-semibold md:p-4">{row.truckbuck}</td>
                  <td className="p-3 text-muted-foreground md:p-4">{row.broker}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <ChargesSection charges={charges} />

      <PageFaq faqs={content.pageFaqs.pricing} title={content.common.faqTitle} />

      <FinalCta
        title={p.final.title}
        body={p.final.body}
        actions={
          <Button asChild variant="cta" size="lg">
            <Link href={getPriceHref}>{content.cta.getPrice}</Link>
          </Button>
        }
      />
    </>
  );
}

function ChargesSection({
  charges,
}: {
  charges: Awaited<ReturnType<typeof getSiteConfig<"shipper.charges">>>;
}) {
  const c = content.pricing.charges;
  const waiting =
    charges.waiting_free_hours !== null && charges.waiting_per_hour_paise !== null
      ? fill(c.waitingValue, {
          free: charges.waiting_free_hours,
          rate: rupees(charges.waiting_per_hour_paise),
        })
      : null;
  const rows: { label: string; value: string | null; missing: NfcRef }[] = [
    { label: c.waiting, value: waiting, missing: "waiting charges (NFC-2)" },
    { label: c.cancellation, value: charges.cancellation, missing: "cancellation policy (NFC-11)" },
    { label: c.payment, value: charges.payment_terms, missing: "payment terms (NFC-11)" },
  ];
  const known = rows.filter((row) => row.value);
  if (known.length === 0 && process.env.NODE_ENV === "production") return null;
  return (
    <Section labelledBy="charges-title">
      <SectionHeading id="charges-title" title={c.title} />
      <dl className="grid gap-4 md:grid-cols-3">
        {rows.map((row) =>
          row.value || process.env.NODE_ENV !== "production" ? (
            <div key={row.label} className="grid gap-1 rounded-xl border bg-surface p-5">
              <dt className="font-semibold">{row.label}</dt>
              <dd className="text-muted-foreground">
                {row.value ?? <MissingFact what={row.missing} />}
              </dd>
            </div>
          ) : null,
        )}
      </dl>
    </Section>
  );
}
