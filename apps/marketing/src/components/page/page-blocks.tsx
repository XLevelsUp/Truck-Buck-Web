import type { ReactNode } from "react";

import { Accordion, AccordionItem } from "@truckbuck/ui/accordion";
import { Badge } from "@truckbuck/ui/badge";

import { MissingFact } from "@/components/missing-fact";
import { type FeatureKey, featureStatus, isShown } from "@/content/features";

import { Section, SectionHeading } from "./section";

/** Structured data, with `<` escaped so content can never close the tag. */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/** Page hero: eyebrow, H1 (the LCP element), lead, actions, optional aside. */
export function PageHero({
  eyebrow,
  title,
  lead,
  actions,
  aside,
  variant,
}: {
  eyebrow?: string;
  title: string;
  lead: string;
  actions?: ReactNode;
  aside?: ReactNode;
  /** Hero copy variant shown (A/B), exposed for analytics. */
  variant?: string;
}) {
  return (
    <section
      aria-labelledby="page-title"
      data-hero-variant={variant}
      className="border-b bg-background"
    >
      <div className="mx-auto grid max-w-(--container-content) gap-8 page-gutter py-10 md:py-16 lg:grid-cols-[1fr_minmax(0,28rem)] lg:items-center lg:gap-12">
        <div className="grid content-start gap-4">
          {eyebrow ? (
            <p className="text-sm font-semibold tracking-wide text-link uppercase">{eyebrow}</p>
          ) : null}
          <h1 id="page-title" className="text-5xl font-extrabold text-balance">
            {title}
          </h1>
          <p className="max-w-prose text-lg text-muted-foreground">{lead}</p>
          {actions ? <div className="mt-2 flex flex-wrap gap-3">{actions}</div> : null}
        </div>
        {aside ? <div className="min-w-0">{aside}</div> : null}
      </div>
    </section>
  );
}

export interface FeatureItem {
  key: FeatureKey;
  title: string;
  body: string;
  icon: ReactNode;
}

/**
 * Feature cards driven by src/content/features.ts: "roadmap" gets a Coming
 * soon tag; "unconfirmed" is a missing-fact marker in development and absent in production.
 */
export function FeatureGrid({
  items,
  roadmapLabel,
}: {
  items: FeatureItem[];
  roadmapLabel: string;
}) {
  const visible = items.filter((item) => isShown(item.key));
  if (visible.length === 0) return null;
  return (
    <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {visible.map((item) => {
        const status = featureStatus[item.key];
        return (
          <li key={item.key} className="flex gap-4 rounded-xl border bg-surface p-5">
            <span
              aria-hidden="true"
              className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary-soft-foreground [&_svg]:size-5"
            >
              {item.icon}
            </span>
            <span className="grid content-start gap-1">
              <span className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold">{item.title}</h3>
                {status === "roadmap" ? <Badge variant="info">{roadmapLabel}</Badge> : null}
                {status === "unconfirmed" ? (
                  <MissingFact what={`confirm "${item.key}" (NFC-11)`} />
                ) : null}
              </span>
              <span className="text-muted-foreground">{item.body}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export interface FaqEntry {
  question: string;
  answer: string;
}

/** FAQ section + FAQPage structured data. Answers live in the HTML (native details). */
export function PageFaq({
  faqs,
  title,
  id = "faq",
}: {
  faqs: readonly FaqEntry[];
  title: string;
  id?: string;
}) {
  if (faqs.length === 0) return null;
  return (
    <Section labelledBy={`${id}-title`} id={id}>
      <SectionHeading id={`${id}-title`} title={title} />
      <Accordion className="max-w-3xl">
        {faqs.map((faq) => (
          <AccordionItem key={faq.question} name={id} title={faq.question}>
            {faq.answer}
          </AccordionItem>
        ))}
      </Accordion>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: { "@type": "Answer", text: faq.answer },
          })),
        }}
      />
    </Section>
  );
}

/** Closing call to action on a brand band. */
export function FinalCta({
  title,
  body,
  actions,
  aside,
}: {
  title: string;
  body: string;
  actions: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section
      aria-labelledby="final-title"
      className="bg-surface-brand text-surface-brand-foreground"
    >
      <div className="mx-auto grid max-w-(--container-content) gap-8 page-gutter py-14 md:grid-cols-2 md:items-center md:py-20">
        <div className="grid gap-4">
          <h2 id="final-title" className="text-4xl font-extrabold">
            {title}
          </h2>
          <p className="text-lg">{body}</p>
          <div className="flex flex-wrap gap-3">{actions}</div>
        </div>
        {aside ? <div className="md:justify-self-end">{aside}</div> : null}
      </div>
    </section>
  );
}
