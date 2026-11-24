import Link from "next/link";

import { Badge } from "@truckbuck/ui/badge";

import { getContent } from "@/content";
import type { Locale } from "@/i18n/locales";
import { getPriceHrefFor } from "@/lib/routes";
import type { Lane, ServiceArea } from "@/server/catalog-types";

import { Section, SectionHeading } from "./sections";

/*
 * Abstract coverage map: cities plotted at their real coordinates
 * (equirectangular, scaled for India's latitude) with corridor lines.
 * Deliberately NO country outline — maps of India published in India must
 * show the Survey of India boundary, and this avoids the issue entirely.
 */
const BOUNDS = { west: 68, east: 97.5, north: 37, south: 6 };
const SCALE = 20;
const LNG_FACTOR = Math.cos((22 * Math.PI) / 180);

const project = (lat: number, lng: number) => ({
  x: (lng - BOUNDS.west) * LNG_FACTOR * SCALE,
  y: (BOUNDS.north - lat) * SCALE,
});

function viewBoxFor(areas: ServiceArea[]) {
  const points = areas.map((a) => project(a.lat, a.lng));
  const pad = 60;
  const minX = Math.min(...points.map((p) => p.x)) - pad;
  const maxX = Math.max(...points.map((p) => p.x)) + pad + 80;
  const minY = Math.min(...points.map((p) => p.y)) - pad;
  const maxY = Math.max(...points.map((p) => p.y)) + pad;
  return { minX, minY, width: maxX - minX, height: maxY - minY };
}

export function Coverage({
  areas,
  lanes,
  isSample,
  locale = "en",
}: {
  areas: ServiceArea[];
  lanes: Lane[];
  isSample: boolean;
  locale?: Locale;
}) {
  const c = getContent(locale).home.coverage;
  if (areas.length === 0) return null;
  const bySlug = new Map(areas.map((a) => [a.slug, a]));
  const box = viewBoxFor(areas);

  return (
    <Section labelledBy="coverage-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading id="coverage-title" title={c.title} lead={c.lead} />
        {isSample ? <Badge variant="warning">{c.sample}</Badge> : null}
      </div>
      <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center">
        <svg
          role="img"
          aria-labelledby="coverage-map-title"
          viewBox={`${box.minX} ${box.minY} ${box.width} ${box.height}`}
          className="h-auto w-full rounded-2xl border bg-surface-muted"
        >
          <title id="coverage-map-title">{c.mapLabel}</title>
          <defs>
            <pattern id="coverage-grid" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" className="fill-border" />
            </pattern>
          </defs>
          <rect
            x={box.minX}
            y={box.minY}
            width={box.width}
            height={box.height}
            fill="url(#coverage-grid)"
          />
          <g
            className="stroke-primary"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="1 7"
            fill="none"
          >
            {lanes.map((lane) => {
              const a = bySlug.get(lane.from);
              const b = bySlug.get(lane.to);
              if (!a || !b) return null;
              const p = project(a.lat, a.lng);
              const q = project(b.lat, b.lng);
              return <line key={`${lane.from}-${lane.to}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} />;
            })}
          </g>
          {areas.map((area) => {
            const p = project(area.lat, area.lng);
            return (
              <g key={area.slug}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="9"
                  className="fill-accent stroke-surface"
                  strokeWidth="3"
                />
                <text
                  x={p.x + 14}
                  y={p.y + 5}
                  className="fill-foreground text-[15px] font-semibold"
                >
                  {area.name}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="grid gap-3">
          <h3 className="text-lg font-bold">{c.listTitle}</h3>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2">
            {areas.map((area) => (
              <li key={area.slug}>
                <span className="font-semibold">{area.name}</span>
                <span className="text-muted-foreground">, {area.state}</span>
              </li>
            ))}
          </ul>
          <Link
            href={getPriceHrefFor(locale)}
            className="w-fit rounded-sm font-semibold text-link underline underline-offset-4 focus-ring"
          >
            {c.cta}
          </Link>
        </div>
      </div>
    </Section>
  );
}
