import { Section } from "@/components/page/section";
import { getContent } from "@/content";
import { getSiteMetrics } from "@/server/catalog";

const number = new Intl.NumberFormat("en-IN");
const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

/**
 * Trips completed / transporters onboarded, from real booking-system counts
 * only (site_metrics). getSiteMetrics already drops stale rows and anything
 * below the client's threshold, so with no data this renders nothing at all.
 */
export async function LiveCounters({ headingLevel = 2 }: { headingLevel?: 2 | 3 }) {
  const metrics = await getSiteMetrics();
  if (metrics.length === 0) return null;
  const { about } = getContent();
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const latest = metrics
    .map((m) => m.measuredAt)
    .sort()
    .at(-1);
  return (
    <section aria-labelledby="counters-title" data-testid="live-counters" className="grid gap-4">
      <Heading id="counters-title" className="text-2xl font-bold">
        {about.countersTitle}
      </Heading>
      <dl className="grid gap-4 md:grid-cols-2">
        {metrics.map((metric) => (
          <div key={metric.key} className="grid rounded-xl border bg-surface p-5">
            <dt className="order-2 text-muted-foreground">{about.counters[metric.key]}</dt>
            <dd className="order-1 text-4xl font-extrabold tabular-nums">
              {number.format(metric.value)}
            </dd>
          </div>
        ))}
      </dl>
      {latest ? (
        <p className="text-sm text-muted-foreground">
          {about.counters.asOf.replace("{date}", date.format(new Date(latest)))}
        </p>
      ) : null}
    </section>
  );
}

/** Home band: a full section only when there is at least one real counter to show. */
export async function LiveCountersSection() {
  const metrics = await getSiteMetrics();
  if (metrics.length === 0) return null;
  return (
    <Section labelledBy="counters-title" tone="muted">
      <LiveCounters />
    </Section>
  );
}
