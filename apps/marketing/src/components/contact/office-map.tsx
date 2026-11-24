"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

import { Button } from "@truckbuck/ui/button";
import { MapContainer } from "@truckbuck/ui/map-container";

/**
 * Registered-office map, loaded only when asked for: no Google Maps request
 * (and no third-party cookies) until the visitor taps "Show map". Without an
 * embed key it is just a link to Google Maps.
 */
export function OfficeMap({
  address,
  embedKey,
  labels,
}: {
  address: string;
  embedKey: string | null;
  labels: { map: string; show: string; open: string };
}) {
  const [shown, setShown] = useState(false);
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <div className="grid gap-3">
      {embedKey ? (
        <MapContainer label={labels.map} fallback={address} ratio="4/3">
          {shown ? (
            <iframe
              title={labels.map}
              src={`https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(embedKey)}&q=${encodeURIComponent(address)}`}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              className="absolute inset-0 size-full border-0"
            />
          ) : undefined}
        </MapContainer>
      ) : null}
      <div className="flex flex-wrap gap-3">
        {embedKey && !shown ? (
          <Button variant="secondary" onClick={() => setShown(true)}>
            <MapPin aria-hidden="true" /> {labels.show}
          </Button>
        ) : null}
        <Button asChild variant="ghost">
          <a href={mapsLink} target="_blank" rel="noopener">
            {labels.open}
          </a>
        </Button>
      </div>
    </div>
  );
}
