import { CarFront, FileCheck2, Fingerprint, Route, Star } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@truckbuck/ui/badge";

import { MissingFact } from "@/components/missing-fact";
import type { Content } from "@/content";
import { company } from "@/content/company";
import { type FeatureKey, featureStatus, isShown } from "@/content/features";
import { fill, trimNumber } from "@/lib/format";

const icons: Record<string, ReactNode> = {
  vetKyc: <Fingerprint />,
  vetVehicleDocs: <FileCheck2 />,
  vetDriverLicence: <CarFront />,
  vetFirstTrip: <Route />,
  vetRatingThreshold: <Star />,
};

type Pipeline = Content["safety"]["pipeline"];

/**
 * The transporter vetting steps as a numbered pipeline. Each step's status
 * comes from features.ts: "live" shows plainly, "roadmap" gets a Coming soon
 * tag and its note, "unconfirmed" is a marker in development and absent in
 * production (the remaining steps renumber, so nothing implies a gap).
 */
export function VettingPipeline({
  pipeline,
  roadmapLabel,
}: {
  pipeline: Pipeline;
  roadmapLabel: string;
}) {
  const steps = pipeline.steps.filter((step) => isShown(step.key as FeatureKey));
  const rating = company.suspendBelowRating;
  return (
    <ol className="relative grid gap-4 md:grid-cols-[repeat(auto-fit,minmax(13rem,1fr))]">
      {steps.map((step, index) => {
        const status = featureStatus[step.key as FeatureKey];
        const body =
          step.key === "vetRatingThreshold"
            ? fill(step.body, { rating: rating === null ? "…" : trimNumber(rating) })
            : step.body;
        return (
          <li
            key={step.key}
            data-step={step.key}
            className="relative grid content-start gap-3 rounded-xl border bg-surface p-5"
          >
            <span className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground [&_svg]:size-5"
              >
                {icons[step.key]}
              </span>
              <span className="text-sm font-semibold text-muted-foreground">
                {fill(pipeline.stepLabel, { n: index + 1 })}
              </span>
            </span>
            <span className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold">{step.title}</h3>
              {status === "roadmap" ? <Badge variant="info">{roadmapLabel}</Badge> : null}
            </span>
            <p className="text-muted-foreground">{body}</p>
            {status === "roadmap" && step.note ? (
              <p className="text-sm font-medium">{step.note}</p>
            ) : null}
            {status === "unconfirmed" ? (
              <MissingFact what={`confirm vetting step "${step.key}" (NFC-5)`} />
            ) : null}
            {step.key === "vetRatingThreshold" && rating === null ? (
              <MissingFact what="suspension rating threshold (NFC-5)" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
