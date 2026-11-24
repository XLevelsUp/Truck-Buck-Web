"use client";

import { type ReactNode, type Ref, useState } from "react";
import { Check, ExternalLink, Map as MapIcon, X } from "lucide-react";

import type { EstimateResponse } from "@truckbuck/types";
import { Badge } from "@truckbuck/ui/badge";
import { Button } from "@truckbuck/ui/button";
import { MapContainer } from "@truckbuck/ui/map-container";
import { formatINR } from "@truckbuck/utils";

import { fill } from "@/lib/format";

import type { WidgetLabels } from "./labels";

function directionsUrl(estimate: EstimateResponse): string {
  const params = new URLSearchParams({
    api: "1",
    origin: `${estimate.from.lat},${estimate.from.lng}`,
    destination: `${estimate.to.lat},${estimate.to.lng}`,
    travelmode: "driving",
  });
  if (!estimate.from.placeId.startsWith("sample:"))
    params.set("origin_place_id", estimate.from.placeId);
  if (!estimate.to.placeId.startsWith("sample:"))
    params.set("destination_place_id", estimate.to.placeId);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function transitText(hours: { min: number; max: number }, labels: WidgetLabels["result"]): string {
  if (hours.max <= 30) return fill(labels.hours, hours);
  return fill(labels.days, {
    min: Math.max(1, Math.round(hours.min / 24)),
    max: Math.ceil(hours.max / 24),
  });
}

function RouteMap({
  estimate,
  labels,
  embedKey,
}: {
  estimate: EstimateResponse;
  labels: WidgetLabels["result"];
  embedKey: string | null;
}) {
  const [interactive, setInteractive] = useState(false);
  const label = fill(labels.mapLabel, { from: estimate.from.label, to: estimate.to.label });
  const external = directionsUrl(estimate);

  if (interactive && embedKey) {
    const src = new URL("https://www.google.com/maps/embed/v1/directions");
    src.searchParams.set("key", embedKey);
    src.searchParams.set("origin", `place_id:${estimate.from.placeId}`);
    src.searchParams.set("destination", `place_id:${estimate.to.placeId}`);
    src.searchParams.set("mode", "driving");
    return (
      <MapContainer label={label}>
        <iframe
          title={label}
          src={src.toString()}
          className="absolute inset-0 size-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </MapContainer>
    );
  }

  return (
    <div className="grid gap-2">
      <MapContainer label={label} fallback={`${estimate.from.label} → ${estimate.to.label}`}>
        {estimate.mapUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- a proxied, already-sized static map; next/image would re-optimise a remote PNG for no gain.
          <img
            src={estimate.mapUrl}
            alt=""
            width={640}
            height={360}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full object-cover"
          />
        ) : undefined}
      </MapContainer>
      <div className="flex flex-wrap gap-x-4">
        {embedKey && estimate.mapUrl ? (
          <Button variant="link" onClick={() => setInteractive(true)}>
            <MapIcon aria-hidden="true" /> {labels.openMap}
          </Button>
        ) : null}
        <Button asChild variant="link">
          <a href={external} target="_blank" rel="noopener">
            <ExternalLink aria-hidden="true" /> {labels.openInMaps}
          </a>
        </Button>
      </div>
    </div>
  );
}

interface EstimateResultProps {
  estimate: EstimateResponse;
  labels: WidgetLabels;
  embedKey: string | null;
  /** Receives focus when a new result arrives (screen readers hear it). */
  headingRef: Ref<HTMLHeadingElement>;
}

/** The fare (or the honest "we'll call you" alternative), then the route preview. */
export function EstimateResult({ estimate, labels, embedKey, headingRef }: EstimateResultProps) {
  {
    const { quote } = estimate;
    const r = labels.result;

    let headline: ReactNode;
    if (!estimate.served) {
      headline = (
        <div className="grid gap-1">
          <h3 ref={headingRef} tabIndex={-1} className="text-2xl font-bold outline-none">
            {r.notServedTitle}
          </h3>
          <p className="text-muted-foreground">{r.notServedBody}</p>
        </div>
      );
    } else if (!quote) {
      headline = (
        <div className="grid gap-1">
          <h3 ref={headingRef} tabIndex={-1} className="text-2xl font-bold outline-none">
            {r.unpricedTitle}
          </h3>
          <p className="text-muted-foreground">{r.unpricedBody}</p>
        </div>
      );
    } else {
      headline = (
        <div className="grid gap-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 ref={headingRef} tabIndex={-1} className="text-lg font-semibold outline-none">
              {r.title}
            </h3>
            {quote.sample ? <Badge variant="warning">{r.sample}</Badge> : null}
          </div>
          <p
            className="text-4xl font-extrabold tracking-tight tabular-nums"
            data-testid="fare-range"
          >
            {fill(r.range, {
              min: formatINR(quote.fare.minPaise, { wholeRupees: true }),
              max: formatINR(quote.fare.maxPaise, { wholeRupees: true }),
            })}
          </p>
          <p className="text-sm text-muted-foreground">{fill(r.gstNote, { gst: quote.gstPct })}</p>
        </div>
      );
    }

    return (
      <div className="grid gap-5">
        {headline}

        <dl className="grid grid-cols-2 gap-4 rounded-xl bg-surface-muted p-4">
          <div className="grid">
            <dt className="text-sm text-muted-foreground">{r.distance}</dt>
            <dd className="text-lg font-bold tabular-nums">
              {fill(r.distanceValue, { km: estimate.distanceKm.toLocaleString("en-IN") })}
            </dd>
          </div>
          {quote ? (
            <div className="grid">
              <dt className="text-sm text-muted-foreground">{r.transit}</dt>
              <dd className="text-lg font-bold">{transitText(quote.transitHours, r)}</dd>
            </div>
          ) : null}
        </dl>

        {quote ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid content-start gap-2">
              <h4 className="font-semibold">{r.includes}</h4>
              <ul className="grid gap-1.5">
                {quote.includes.map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid content-start gap-2">
              <h4 className="font-semibold">{r.excludes}</h4>
              <ul className="grid gap-1.5">
                {quote.excludes.map((item) => (
                  <li key={item} className="flex gap-2 text-muted-foreground">
                    <X aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {quote.surcharges.night || quote.surcharges.urgent ? (
              <ul className="grid gap-1 text-sm text-muted-foreground md:col-span-2">
                {quote.surcharges.night ? <li>{r.night}</li> : null}
                {quote.surcharges.urgent ? <li>{r.urgent}</li> : null}
              </ul>
            ) : null}
          </div>
        ) : null}

        <RouteMap estimate={estimate} labels={r} embedKey={embedKey} />
      </div>
    );
  }
}
