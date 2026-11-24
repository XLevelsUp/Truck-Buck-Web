import { formatINR } from "@truckbuck/utils";

import { routeSummary } from "@/components/truck-booking/route-page";
import { getContent } from "@/content";
import { fill } from "@/lib/format";
import { ogSize, pageOgImage } from "@/lib/og";
import { getCityFacts, getRouteFacts, parseLaneSlug } from "@/server/lane-facts";

const c = getContent();
const t = c.truckBooking;

export const size = ogSize;
export const contentType = "image/png";

async function describe(slug: string | undefined) {
  // Next can call image metadata without params while collecting page data.
  if (typeof slug !== "string") return null;
  if (parseLaneSlug(slug)) {
    const facts = await getRouteFacts(slug);
    if (!facts) return null;
    const { km, lowPaise } = routeSummary(facts);
    const title = fill(t.city.routeLink, { from: facts.from.name, to: facts.to.name });
    // "Fares from" only with real rates: sample prices never reach a share card.
    const eyebrow =
      facts.indexable && lowPaise !== null
        ? `${fill(t.route.facts.distanceValue, { km })} · ${t.route.facts.fareFrom} ${formatINR(lowPaise, { wholeRupees: true })}`
        : fill(t.route.facts.distanceValue, { km });
    return { title, eyebrow };
  }
  const facts = await getCityFacts(slug);
  if (!facts) return null;
  return { title: fill(t.city.title, { city: facts.area.name }), eyebrow: facts.area.state };
}

export async function generateImageMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const info = await describe(slug);
  return [
    {
      id: "og",
      alt: info ? `${info.title} | ${c.site.name}` : c.site.name,
      size: ogSize,
      contentType: "image/png",
    },
  ];
}

/** Share card for a city or lane page: route name, distance and (real) fare-from. */
export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const info = await describe(slug);
  return pageOgImage({
    title: info?.title ?? t.hub.title,
    eyebrow: info?.eyebrow ?? c.site.name,
    truck: "mcv",
  });
}
