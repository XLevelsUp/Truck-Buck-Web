import type { ReactNode } from "react";

import { cn } from "@truckbuck/ui/lib/utils";

/** Top-level styleguide section with an anchor for the in-page nav. */
export function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-6 border-t py-12">
      <h2 id={`${id}-title`} className="text-3xl font-bold">
        {title}
      </h2>
      {description ? <p className="mt-2 max-w-prose text-muted-foreground">{description}</p> : null}
      <div className="mt-8 grid gap-12 [&>*]:min-w-0">{children}</div>
    </section>
  );
}

/** One token group or component demo inside a Section. */
export function Demo({
  title,
  note,
  children,
  className,
}: {
  title: string;
  note?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="grid min-w-0 gap-4">
      <div className="grid gap-1">
        <h3 className="text-xl font-bold">{title}</h3>
        {note ? <p className="max-w-prose text-sm text-muted-foreground">{note}</p> : null}
      </div>
      <div className={cn("min-w-0 rounded-xl border bg-surface p-4 md:p-6", className)}>
        {children}
      </div>
    </div>
  );
}

/** Small monospace label for token names and values. */
export function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-sm bg-surface-muted px-1.5 py-0.5 font-mono text-sm text-foreground">
      {children}
    </code>
  );
}
