import Link from "next/link";

import { Badge } from "@truckbuck/ui/badge";
import { Button } from "@truckbuck/ui/button";
import { TruckCard } from "@truckbuck/ui/truck-card";

import { TruckCardMedia } from "@/components/trucks/truck-media";
import { getContent } from "@/content";
import type { Locale } from "@/i18n/locales";
import { fill, trimNumber } from "@/lib/format";
import type { TruckType } from "@/server/catalog-types";

import { Section, SectionHeading } from "./sections";

/** Horizontal scroll-snap list (native swipe, no carousel JS) → /trucks/[slug]. */
export function TruckCarousel({ trucks, locale = "en" }: { trucks: TruckType[]; locale?: Locale }) {
  const t = getContent(locale).home.trucks;
  if (trucks.length === 0) return null;
  return (
    <Section labelledBy="trucks-title">
      <SectionHeading id="trucks-title" title={t.title} lead={t.lead} />
      <ul
        aria-label={t.listLabel}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 md:-mx-6 md:px-6"
      >
        {trucks.map((truck) => {
          return (
            <li key={truck.slug} className="w-[17rem] shrink-0 snap-start">
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
                badge={truck.isSample ? <Badge variant="warning">{t.sample}</Badge> : undefined}
                specs={[
                  {
                    label: t.payload,
                    value: fill(t.tonnes, { value: trimNumber(truck.payloadTonnes) }),
                  },
                  { label: t.length, value: fill(t.feet, { value: trimNumber(truck.lengthFt) }) },
                ]}
                action={
                  <Button asChild variant="secondary" block>
                    <Link href={`/trucks/${truck.slug}`}>
                      {t.cta}
                      <span className="sr-only">: {truck.name}</span>
                    </Link>
                  </Button>
                }
              />
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
