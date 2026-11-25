import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ExperimentExposure } from "@/components/experiment-exposure";
import { homeMetadata, HomePage } from "@/components/pages/home-page";
import { shippersMetadata, ShippersPage } from "@/components/pages/shippers-page";
import { transportersMetadata, TransportersPage } from "@/components/pages/transporters-page";
import { env } from "@/env";
import {
  allAssignments,
  type Assignment,
  CONTROL,
  decodeAssignment,
  enabledExperiments,
  encodeAssignment,
  type ExperimentPage,
  experimentPages,
} from "@/lib/experiments";

/*
 * Prerendered A/B variants. Never linked: src/proxy.ts rewrites "/",
 * "/shippers" and "/transporters" here for assigned visitors, so the address
 * bar keeps the real URL. Metadata (canonical included) is the real page's.
 */

const isPage = (page: string): page is ExperimentPage =>
  (experimentPages as readonly string[]).includes(page);

/** Home: every combination. Shippers/transporters: hero variants only. */
export function generateStaticParams() {
  const home = allAssignments().map((a) => ({ page: "home", variant: encodeAssignment(a) }));
  const heroOnly = (["shippers", "transporters"] as const).flatMap((page) =>
    (["a", "b", "c"] as const).map((hero) => ({
      page,
      variant: encodeAssignment({ ...CONTROL, hero }),
    })),
  );
  return [...home, ...heroOnly];
}

function resolve(page: string, variant: string): { page: ExperimentPage; a: Assignment } {
  const a = decodeAssignment(variant);
  if (!isPage(page) || !a) notFound();
  return { page, a };
}

export async function generateMetadata({
  params,
}: PageProps<"/x/[page]/[variant]">): Promise<Metadata> {
  const { page, variant } = await params;
  const { page: p } = resolve(page, variant);
  if (p === "home") return homeMetadata("en");
  if (p === "shippers") return shippersMetadata();
  return transportersMetadata("en");
}

export default async function VariantPage({ params }: PageProps<"/x/[page]/[variant]">) {
  const { page, variant } = await params;
  const { page: p, a } = resolve(page, variant);
  return (
    <>
      {p === "home" ? (
        <HomePage locale="en" assignment={a} />
      ) : p === "shippers" ? (
        <ShippersPage heroVariant={a.hero} />
      ) : (
        <TransportersPage locale="en" heroVariant={a.hero} />
      )}
      <ExperimentExposure
        assignment={p === "home" ? a : { hero: a.hero }}
        enabled={enabledExperiments(env.NEXT_PUBLIC_EXPERIMENTS)}
      />
    </>
  );
}
