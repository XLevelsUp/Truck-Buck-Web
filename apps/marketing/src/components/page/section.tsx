import type { ReactNode } from "react";

/** Section heading: optional eyebrow, H2 (id for aria-labelledby), optional lead. */
export function SectionHeading({
  id,
  title,
  lead,
  eyebrow,
}: {
  id: string;
  title: string;
  lead?: string;
  eyebrow?: string;
}) {
  return (
    <div className="grid max-w-prose gap-2">
      {eyebrow ? (
        <p className="text-sm font-semibold tracking-wide text-link uppercase">{eyebrow}</p>
      ) : null}
      <h2 id={id} className="text-3xl font-extrabold">
        {title}
      </h2>
      {lead ? <p className="text-lg text-muted-foreground">{lead}</p> : null}
    </div>
  );
}

export function Section({
  labelledBy,
  id,
  tone = "default",
  children,
}: {
  labelledBy: string;
  id?: string;
  tone?: "default" | "muted";
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={`scroll-mt-16 py-14 md:py-20 ${tone === "muted" ? "bg-surface-muted" : ""}`}
    >
      <div className="mx-auto grid max-w-(--container-content) gap-8 page-gutter [&>*]:min-w-0">
        {children}
      </div>
    </section>
  );
}
