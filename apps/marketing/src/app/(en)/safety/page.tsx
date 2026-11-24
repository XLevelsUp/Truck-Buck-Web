import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Bed, Gauge, MapPinned, ShieldCheck, Trophy, Umbrella } from "lucide-react";

import { Button } from "@truckbuck/ui/button";

import { MissingFact } from "@/components/missing-fact";
import { FeatureGrid, type FeatureItem, FinalCta, PageHero } from "@/components/page/page-blocks";
import { Section, SectionHeading } from "@/components/page/section";
import { VettingPipeline } from "@/components/safety/vetting-pipeline";
import { getContent } from "@/content";
import { featureStatus, isShown } from "@/content/features";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";

const content = getContent();
const s = content.safety;

export const metadata: Metadata = pageMetadata({
  title: s.meta.title,
  description: s.meta.description,
  path: routes.safety.path,
});

export default function SafetyPage() {
  const cargo: FeatureItem[] = [
    { key: "podPhotoSignature", ...s.cargo.items.podPhotoSignature, icon: <ShieldCheck /> },
    { key: "liveTracking", ...s.cargo.items.liveTracking, icon: <MapPinned /> },
    { key: "incidentProcess", ...s.cargo.items.incidentProcess, icon: <AlertTriangle /> },
    { key: "insuranceGuidance", ...s.cargo.items.insuranceGuidance, icon: <Umbrella /> },
  ];
  const driver: FeatureItem[] = [
    { key: "noSpeedIncentives", ...s.driver.items.noSpeedIncentives, icon: <Gauge /> },
    { key: "restStopPolicy", ...s.driver.items.restStopPolicy, icon: <Bed /> },
    { key: "safetyWeightedRewards", ...s.driver.items.safetyWeightedRewards, icon: <Trophy /> },
  ];
  const cargoShown = cargo.some((item) => isShown(item.key));
  const roadmap = content.common.roadmap;

  return (
    <>
      <PageHero eyebrow={s.hero.eyebrow} title={s.hero.title} lead={s.hero.lead} />

      <Section labelledBy="pipeline-title">
        <SectionHeading id="pipeline-title" title={s.pipeline.title} lead={s.pipeline.lead} />
        <VettingPipeline pipeline={s.pipeline} roadmapLabel={roadmap} />
      </Section>

      {cargoShown ? (
        <Section labelledBy="cargo-title" tone="muted">
          <SectionHeading id="cargo-title" title={s.cargo.title} lead={s.cargo.lead} />
          <FeatureGrid items={cargo} roadmapLabel={roadmap} />
          {isShown("insuranceGuidance") ? (
            <div className="grid max-w-prose gap-3 rounded-xl border bg-surface p-5">
              <h3 className="flex flex-wrap items-center gap-2 text-xl font-bold">
                {s.insurance.title}
                {featureStatus.insuranceGuidance === "unconfirmed" ? (
                  <MissingFact what="insurance wording approved by ops and counsel (NFC-11)" />
                ) : null}
              </h3>
              {s.insurance.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          ) : null}
        </Section>
      ) : null}

      <Section labelledBy="driver-title">
        <SectionHeading id="driver-title" title={s.driver.title} lead={s.driver.lead} />
        <FeatureGrid items={driver} roadmapLabel={roadmap} />
      </Section>

      <FinalCta
        title={s.cta.title}
        body={s.cta.body}
        actions={
          <Button asChild variant="cta" size="lg">
            <Link href={routes.contact.path}>{s.cta.contact}</Link>
          </Button>
        }
      />
    </>
  );
}
