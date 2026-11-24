import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@truckbuck/ui/badge";
import { Button } from "@truckbuck/ui/button";
import { TruckCard } from "@truckbuck/ui/truck-card";

import { FinalCta, PageFaq, PageHero } from "@/components/page/page-blocks";
import { Section, SectionHeading } from "@/components/page/section";
import { TruckAdvisor } from "@/components/trucks/truck-advisor";
import { TruckCardMedia } from "@/components/trucks/truck-media";
import { advisorTrucks, truckSpecs } from "@/components/trucks/truck-specs";
import { getContent } from "@/content";
import { getPriceHref, routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { getCatalog } from "@/server/catalog";

const content = getContent();

export const metadata: Metadata = pageMetadata({
  title: content.trucksPage.meta.title,
  description: content.trucksPage.meta.description,
  path: routes.trucks.path,
});

export default async function TrucksPage() {
  const p = content.trucksPage;
  const { trucks } = await getCatalog();

  return (
    <>
      <PageHero
        title={p.title}
        lead={p.lead}
        actions={
          <Button asChild variant="cta" size="lg">
            <Link href={getPriceHref}>{p.cta}</Link>
          </Button>
        }
      />

      <Section labelledBy="catalogue-title">
        <h2 id="catalogue-title" className="sr-only">
          {p.listTitle}
        </h2>
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trucks.map((truck) => (
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
                badge={
                  truck.isSample ? (
                    <Badge variant="warning">{content.common.sample}</Badge>
                  ) : undefined
                }
                specs={truckSpecs(truck)}
                action={
                  <Button asChild variant="secondary" block>
                    <Link href={`/trucks/${truck.slug}`}>
                      {content.home.trucks.cta}
                      <span className="sr-only">: {truck.name}</span>
                    </Link>
                  </Button>
                }
              />
            </li>
          ))}
        </ul>
      </Section>

      <Section labelledBy="helper-title" id="which-truck" tone="muted">
        <SectionHeading id="helper-title" title={p.helper.title} lead={p.helper.lead} />
        <div className="rounded-2xl border bg-surface p-4 md:p-6">
          <TruckAdvisor
            labels={p.helper}
            trucks={advisorTrucks(trucks)}
            optionalLabel={content.common.optional}
          />
        </div>
      </Section>

      <PageFaq faqs={content.pageFaqs.trucks} title={content.common.faqTitle} />

      <FinalCta
        title={content.home.final.title}
        body={content.home.final.body}
        actions={
          <Button asChild variant="cta" size="lg">
            <Link href={getPriceHref}>{content.cta.getPrice}</Link>
          </Button>
        }
      />
    </>
  );
}
