import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { formatINR } from "@truckbuck/utils";

import { CityPage } from "@/components/truck-booking/city-page";
import { RoutePage, routeSummary } from "@/components/truck-booking/route-page";
import { getContent } from "@/content";
import { fill } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import {
  getCityFacts,
  getCitySlugs,
  getLaneSlugs,
  getRouteFacts,
  parseLaneSlug,
} from "@/server/lane-facts";

/**
 * One segment serves both page types: /truck-booking/<city> and
 * /truck-booking/<from>-to-<to> (city slugs can never contain "-to-").
 * Only cities in `service_areas` and lanes in `lanes` exist; every page is
 * prerendered and refreshed hourly with the catalogue (ISR via cacheLife).
 */
export async function generateStaticParams() {
  const slugs = [...(await getCitySlugs()), ...(await getLaneSlugs())];
  // Cache Components needs at least one param; "none" renders the 404 UI.
  return slugs.length > 0 ? slugs.map((slug) => ({ slug })) : [{ slug: "none" }];
}

const noindex = { robots: { index: false, follow: true } } as const;

export async function generateMetadata({
  params,
}: PageProps<"/truck-booking/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const t = getContent().truckBooking;
  const path = `/truck-booking/${slug}` as const;

  if (parseLaneSlug(slug)) {
    const facts = await getRouteFacts(slug);
    if (!facts) return {};
    const { km, lowPaise } = routeSummary(facts);
    const names = { from: facts.from.name, to: facts.to.name };
    return {
      ...pageMetadata({
        title: fill(t.route.metaTitle, { ...names, km }),
        description:
          lowPaise !== null && facts.indexable
            ? fill(t.route.metaDescription, {
                ...names,
                km,
                fare: formatINR(lowPaise, { wholeRupees: true }),
                count: facts.fares.length,
              })
            : fill(t.route.metaDescriptionNoFare, { ...names, km }),
        path,
      }),
      // Incomplete or sample data is never indexed (Phase 7 brief).
      ...(facts.indexable ? {} : noindex),
    };
  }

  const facts = await getCityFacts(slug);
  if (!facts) return {};
  const { area } = facts;
  return {
    ...pageMetadata({
      title: fill(t.city.metaTitle, { city: area.name }),
      description: facts.lanes.length
        ? fill(t.city.metaDescription, {
            city: area.name,
            state: area.state,
            trucks: facts.trucks.length,
            routes: facts.lanes.length,
          })
        : fill(t.city.metaDescriptionNoRoutes, { city: area.name, state: area.state }),
      path,
    }),
    ...(facts.indexable ? {} : noindex),
  };
}

export default async function TruckBookingPage({ params }: PageProps<"/truck-booking/[slug]">) {
  const { slug } = await params;
  if (parseLaneSlug(slug)) {
    const facts = await getRouteFacts(slug);
    if (!facts) notFound();
    return <RoutePage facts={facts} />;
  }
  const facts = await getCityFacts(slug);
  if (!facts) notFound();
  return <CityPage facts={facts} />;
}
