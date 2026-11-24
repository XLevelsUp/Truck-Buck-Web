import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@truckbuck/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@truckbuck/ui/tabs";

import { MissingFact } from "@/components/missing-fact";
import { FinalCta, PageFaq, PageHero } from "@/components/page/page-blocks";
import { Section } from "@/components/page/section";
import { getContent } from "@/content";
import { type FeatureKey, featureStatus, isShown } from "@/content/features";
import { fill } from "@/lib/format";
import { getPriceHref, routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";

const content = getContent();

export const metadata: Metadata = pageMetadata({
  title: content.howItWorks.meta.title,
  description: content.howItWorks.meta.description,
  path: routes.howItWorks.path,
});

/** Lifecycle steps that depend on a capability ops haven't confirmed yet. */
const stepFeature: Partial<Record<string, FeatureKey>> = {
  status: "liveTracking",
  pod: "podPhotoSignature",
  payment: "paymentStatus",
  rating: "shipperRating",
};

const roles = ["shipper", "transporter", "driver"] as const;

export default function HowItWorksPage() {
  const h = content.howItWorks;
  const steps = h.steps.filter((step) => {
    const feature = stepFeature[step.key];
    return !feature || isShown(feature);
  });

  return (
    <>
      <PageHero
        eyebrow={h.hero.eyebrow}
        title={h.hero.title}
        lead={h.hero.lead}
        actions={
          <Button asChild variant="cta" size="lg">
            <Link href={getPriceHref}>{h.hero.cta}</Link>
          </Button>
        }
      />

      <Section labelledBy="lifecycle-title">
        <h2 id="lifecycle-title" className="text-3xl font-extrabold">
          {h.lifecycleTitle}
        </h2>
        <Tabs defaultValue="shipper">
          <TabsList aria-label={h.tabsLabel}>
            {roles.map((role) => (
              <TabsTrigger key={role} value={role}>
                {h.roles[role]}
              </TabsTrigger>
            ))}
          </TabsList>
          {roles.map((role) => (
            // forceMount keeps every role's steps in the HTML (readable without JS, indexable).
            <TabsContent
              key={role}
              value={role}
              forceMount
              className="data-[state=inactive]:hidden"
            >
              <ol className="mt-2 grid gap-3">
                {steps.map((step, index) => {
                  const text = step[role];
                  const feature = stepFeature[step.key];
                  return (
                    <li
                      key={step.key}
                      className={`flex gap-4 rounded-xl border p-4 ${text ? "bg-surface" : "bg-surface-muted"}`}
                    >
                      <span
                        aria-hidden="true"
                        className={`grid size-9 shrink-0 place-items-center rounded-full font-bold ${
                          text
                            ? "bg-primary text-primary-foreground"
                            : "bg-border text-muted-foreground"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="grid gap-0.5">
                        <span className="sr-only">{fill(h.stepLabel, { n: index + 1 })}: </span>
                        <span className="flex flex-wrap items-center gap-2 text-lg font-bold">
                          {step.title}
                          {feature && featureStatus[feature] === "unconfirmed" ? (
                            <MissingFact what={`confirm "${feature}" (NFC-11)`} />
                          ) : null}
                        </span>
                        <span className="text-muted-foreground">{text || h.noAction}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </TabsContent>
          ))}
        </Tabs>
      </Section>

      <PageFaq faqs={content.pageFaqs.howItWorks} title={content.common.faqTitle} />

      <FinalCta
        title={h.final.title}
        body={h.final.body}
        actions={
          <Button asChild variant="cta" size="lg">
            <Link href={getPriceHref}>{content.cta.getPrice}</Link>
          </Button>
        }
      />
    </>
  );
}
