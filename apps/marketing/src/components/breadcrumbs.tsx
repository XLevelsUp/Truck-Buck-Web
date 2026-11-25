import Link from "next/link";

import { JsonLd } from "@/components/page/page-blocks";
import { getContent } from "@/content";
import { breadcrumbList, type Crumb, graph } from "@/lib/jsonld";

/**
 * Visible breadcrumb trail plus BreadcrumbList structured data. Starts at
 * Home; the last crumb is the current page (not a link).
 */
export function Breadcrumbs({ trail }: { trail: readonly Crumb[] }) {
  const content = getContent();
  const crumbs: Crumb[] = [{ name: content.nav.home, path: "/" }, ...trail];
  return (
    <>
      <JsonLd data={graph(breadcrumbList(crumbs))} />
      <nav aria-label={content.nav.breadcrumb} className="text-sm">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
          {crumbs.map((crumb, index) => {
            const last = index === crumbs.length - 1;
            return (
              <li key={crumb.path} className="flex items-center gap-2">
                {last ? (
                  <span aria-current="page" className="font-medium text-foreground">
                    {crumb.name}
                  </span>
                ) : (
                  <>
                    <Link
                      href={crumb.path}
                      className="inline-flex min-h-6 items-center rounded-sm text-link underline-offset-4 focus-ring hover:underline"
                    >
                      {crumb.name}
                    </Link>
                    <span aria-hidden="true">/</span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
