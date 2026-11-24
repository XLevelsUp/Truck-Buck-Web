import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageHero } from "@/components/page/page-blocks";
import { Section } from "@/components/page/section";
import { getContent } from "@/content";
import { fill } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import { getCatalog } from "@/server/catalog";
import { getCityFacts, getLaneSlugs, getRouteFacts } from "@/server/lane-facts";

const t = getContent().truckBooking;

/** Indexed only once at least one city page is (real lanes, trucks and rates). */
export async function generateMetadata(): Promise<Metadata> {
  const { areas } = await getCatalog();
  const facts = await Promise.all(areas.map((area) => getCityFacts(area.slug)));
  const anyIndexable = facts.some((f) => f?.indexable);
  return {
    ...pageMetadata({
      title: t.hub.metaTitle,
      description: t.hub.metaDescription,
      path: "/truck-booking",
    }),
    ...(anyIndexable ? {} : { robots: { index: false, follow: true } }),
  };
}

/** /truck-booking — every served city and lane, for people and crawlers. */
export default async function TruckBookingHub() {
  const { areas } = await getCatalog();
  const lanes = (
    await Promise.all((await getLaneSlugs()).map((slug) => getRouteFacts(slug)))
  ).filter((lane) => lane !== null);
  return (
    <>
      <PageHero eyebrow={t.hub.eyebrow} title={t.hub.title} lead={t.hub.lead} />
      <Section labelledBy="hub-cities-title">
        <Breadcrumbs trail={[{ name: t.breadcrumb, path: "/truck-booking" }]} />
        <h2 id="hub-cities-title" className="text-2xl font-bold">
          {t.hub.citiesTitle}
        </h2>
        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {areas.map((area) => (
            <li key={area.slug}>
              <Link
                href={`/truck-booking/${area.slug}`}
                className="grid min-h-14 content-center rounded-xl border bg-surface px-4 py-2 focus-ring hover:bg-surface-muted"
              >
                <span className="font-semibold">{fill(t.route.cityLink, { city: area.name })}</span>
                <span className="text-sm text-muted-foreground">{area.state}</span>
              </Link>
            </li>
          ))}
        </ul>
        {lanes.length > 0 ? (
          <>
            <h2 className="text-2xl font-bold">{t.hub.routesTitle}</h2>
            <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {lanes.map((lane) => (
                <li key={lane.slug}>
                  <Link
                    href={`/truck-booking/${lane.slug}`}
                    className="grid min-h-14 content-center rounded-xl border bg-surface px-4 py-2 focus-ring hover:bg-surface-muted"
                  >
                    <span className="font-semibold">
                      {fill(t.city.routeLink, { from: lane.from.name, to: lane.to.name })}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {fill(t.route.facts.distanceValue, { km: Math.round(lane.route.distanceKm) })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </Section>
    </>
  );
}
