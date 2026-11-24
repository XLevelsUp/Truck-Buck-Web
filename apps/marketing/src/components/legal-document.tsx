import { Fragment, type ReactNode } from "react";

import { MissingFact } from "@/components/missing-fact";
import { getContent } from "@/content";
import { company } from "@/content/company";
import type { LegalFactKey, LegalFacts } from "@/lib/legal-facts";

export interface LegalSection {
  heading: string;
  paragraphs: readonly string[];
  items: readonly string[];
}

/** Heading → stable anchor id, e.g. "Your rights" → "your-rights". */
export function anchorFor(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Legal text with `{fact}` tokens. A known fact is filled in; a missing one
 * shows a "Needs from client" marker in development and neutral fallback
 * wording in production, so a draft never shows an invented value.
 */
export function LegalText({ text, facts }: { text: string; facts: LegalFacts }) {
  const parts = text.split(/\{(\w+)\}/g);
  const production = process.env.NODE_ENV === "production";
  return (
    <>
      {parts.map((part, index) => {
        if (index % 2 === 0) return <Fragment key={index}>{part}</Fragment>;
        const fact = facts[part as LegalFactKey] as LegalFacts[LegalFactKey] | undefined;
        if (!fact) return <Fragment key={index}>{`{${part}}`}</Fragment>;
        if (fact.value) return <Fragment key={index}>{fact.value}</Fragment>;
        return production ? (
          <Fragment key={index}>{fact.fallback}</Fragment>
        ) : (
          <MissingFact key={index} what={fact.missing} />
        );
      })}
    </>
  );
}

interface LegalDocumentProps {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: readonly LegalSection[];
  facts: LegalFacts;
  /** Extra blocks after the sections (e.g. the grievance form). */
  children?: ReactNode;
}

/**
 * A legal page: title, date, DRAFT banner until counsel signs off (NFC-19),
 * a contents list and numbered sections with stable anchors.
 */
export function LegalDocument({
  title,
  lastUpdated,
  intro,
  sections,
  facts,
  children,
}: LegalDocumentProps) {
  const { legal } = getContent();
  return (
    <article className="mx-auto max-w-(--container-prose) page-gutter py-12 md:py-16">
      <h1 className="text-4xl font-extrabold text-balance">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {legal.lastUpdatedLabel}: <time dateTime={lastUpdated}>{lastUpdated}</time>
      </p>
      {company.legalReview.approved ? null : (
        <p
          role="note"
          data-testid="legal-draft"
          className="mt-6 rounded-lg border border-warning bg-warning-soft px-4 py-3 text-sm font-semibold text-warning-soft-foreground"
        >
          {legal.draftNotice}
        </p>
      )}
      <p className="mt-6 text-lg">
        <LegalText text={intro} facts={facts} />
      </p>

      {sections.length > 2 ? (
        <nav aria-labelledby="legal-contents" className="mt-8 rounded-xl border bg-surface p-5">
          <h2 id="legal-contents" className="font-bold">
            {legal.contentsTitle}
          </h2>
          <ol className="mt-3 grid list-decimal gap-1.5 pl-5 text-link">
            {sections.map((section) => (
              <li key={section.heading}>
                <a
                  href={`#${anchorFor(section.heading)}`}
                  className="rounded-sm underline-offset-2 focus-ring hover:underline"
                >
                  {section.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      {sections.map((section, index) => (
        <section
          key={section.heading}
          id={anchorFor(section.heading)}
          aria-labelledby={`${anchorFor(section.heading)}-title`}
          className="mt-10 scroll-mt-24"
        >
          <h2 id={`${anchorFor(section.heading)}-title`} className="text-2xl font-bold">
            {index + 1}. {section.heading}
          </h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="mt-3 leading-7">
              <LegalText text={paragraph} facts={facts} />
            </p>
          ))}
          {section.items.length > 0 ? (
            <ul className="mt-3 grid list-disc gap-2 pl-6 leading-7">
              {section.items.map((item) => (
                <li key={item}>
                  <LegalText text={item} facts={facts} />
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
      {children}
    </article>
  );
}
