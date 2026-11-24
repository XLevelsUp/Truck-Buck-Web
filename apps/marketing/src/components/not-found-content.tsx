import Link from "next/link";

import { Button } from "@truckbuck/ui/button";

import { EstimateWidget } from "@/components/estimate/estimate-widget";
import { widgetProps } from "@/components/estimate/widget-props";
import { getContent } from "@/content";
import { routes } from "@/lib/routes";
import { getCatalog } from "@/server/catalog";

/**
 * 404 body: what happened, a way home, and the fare widget — most people who
 * land on a dead link were looking for a truck.
 */
export async function NotFoundContent() {
  const { notFound } = getContent();
  const { trucks } = await getCatalog();
  const { labels, config } = widgetProps(trucks);
  return (
    <div className="mx-auto grid w-full max-w-(--container-content) gap-10 page-gutter py-16 md:py-24 lg:grid-cols-[1fr_minmax(0,30rem)] lg:gap-16">
      <div className="grid content-start justify-items-start gap-4">
        <p className="text-sm font-semibold text-link">404</p>
        <h1 className="text-4xl font-bold">{notFound.title}</h1>
        <p className="text-muted-foreground">{notFound.body}</p>
        <Button asChild className="mt-4">
          <Link href={routes.home.path}>{notFound.cta}</Link>
        </Button>
      </div>
      {trucks.length > 0 ? (
        <section
          aria-labelledby="not-found-widget"
          className="rounded-2xl border bg-surface p-4 shadow-lg md:p-6"
        >
          <h2 id="not-found-widget" className="mb-4 text-xl font-bold">
            {notFound.widgetTitle}
          </h2>
          <EstimateWidget labels={labels} config={config} />
        </section>
      ) : null}
    </div>
  );
}
