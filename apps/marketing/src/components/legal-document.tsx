import { getContent } from "@/content";

interface LegalDocumentProps {
  title: string;
  lastUpdated: string;
  sections: readonly { heading: string; body: string }[];
}

export function LegalDocument({ title, lastUpdated, sections }: LegalDocumentProps) {
  const { legal } = getContent();
  return (
    <article className="mx-auto max-w-(--container-prose) px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {legal.lastUpdatedLabel}: <time dateTime={lastUpdated}>{lastUpdated}</time>
      </p>
      <p
        role="note"
        className="mt-6 rounded-md border border-warning bg-warning/15 px-4 py-3 text-sm"
      >
        {legal.placeholderNotice}
      </p>
      {sections.map((section) => (
        <section key={section.heading} className="mt-8">
          <h2 className="text-xl font-semibold">{section.heading}</h2>
          <p className="mt-2 leading-7">{section.body}</p>
        </section>
      ))}
    </article>
  );
}
