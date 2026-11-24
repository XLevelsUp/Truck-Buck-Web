"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LocateFixed, MapPin } from "lucide-react";

import { Combobox, type ComboboxOption } from "@truckbuck/ui/combobox";
import type { FieldControlProps } from "@truckbuck/ui/field";

import { fill } from "@/lib/format";

import type { WidgetLabels } from "./labels";

export interface Place {
  placeId: string;
  label: string;
}

interface Suggestion {
  placeId: string;
  primary: string;
  secondary: string;
}

interface PlaceFieldProps extends FieldControlProps {
  value: Place | null;
  onChange: (place: Place | null) => void;
  placeholder: string;
  labels: WidgetLabels["widget"];
  /** Shows "Use my location" under the field (pickup only). */
  locate?: boolean;
  onLocateError?: (message: string) => void;
}

const DEBOUNCE_MS = 220;

/**
 * Address search backed by /api/places/autocomplete (Google Places, India
 * only, via our proxy). One session token per field until a place is picked,
 * so Google bills the lookup as one session.
 */
export function PlaceField({
  value,
  onChange,
  placeholder,
  labels,
  locate = false,
  onLocateError,
  ...control
}: PlaceFieldProps) {
  const [text, setText] = useState(value?.label ?? "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const session = useRef<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const timer = useRef<number | undefined>(undefined);

  // Keep the visible text in sync when the place is set from outside (shared link, location).
  const [syncedValue, setSyncedValue] = useState(value);
  if (value !== syncedValue) {
    setSyncedValue(value);
    setText(value?.label ?? "");
  }

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function search(query: string) {
    window.clearTimeout(timer.current);
    controller.current?.abort();
    if (query.trim().length < 2 || query === value?.label) {
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = window.setTimeout(() => {
      session.current ??= crypto.randomUUID();
      const abort = new AbortController();
      controller.current = abort;
      const params = new URLSearchParams({ q: query, session: session.current });
      fetch(`/api/places/autocomplete?${params.toString()}`, { signal: abort.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error(String(response.status));
          const data = (await response.json()) as { suggestions: Suggestion[] };
          setSuggestions(data.suggestions);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setSuggestions([]);
        })
        .finally(() => {
          if (!abort.signal.aborted) setLoading(false);
        });
    }, DEBOUNCE_MS);
  }

  const options = useMemo<ComboboxOption[]>(() => {
    const list: ComboboxOption[] = suggestions.map((s) => ({
      value: s.placeId,
      label: s.primary,
      description: s.secondary,
      icon: <MapPin />,
    }));
    if (value && !list.some((o) => o.value === value.placeId)) {
      list.unshift({ value: value.placeId, label: value.label, icon: <MapPin /> });
    }
    return list;
  }, [suggestions, value]);

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      onLocateError?.(labels.locationDenied);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const params = new URLSearchParams({
          lat: position.coords.latitude.toFixed(5),
          lng: position.coords.longitude.toFixed(5),
        });
        fetch(`/api/places/reverse?${params.toString()}`)
          .then(async (response) => {
            if (!response.ok) throw new Error(String(response.status));
            const { place } = (await response.json()) as { place: Place };
            onChange({ placeId: place.placeId, label: place.label });
          })
          .catch(() => onLocateError?.(labels.locationDenied))
          .finally(() => setLocating(false));
      },
      () => {
        setLocating(false);
        onLocateError?.(labels.locationDenied);
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }

  return (
    <div className="grid gap-1">
      <Combobox
        {...control}
        options={options}
        value={value?.placeId ?? null}
        onValueChange={(_, option) => {
          session.current = null;
          onChange(option ? { placeId: option.value, label: option.label } : null);
        }}
        inputValue={text}
        onInputChange={(next) => {
          setText(next);
          search(next);
        }}
        filter={false}
        loading={loading}
        leadingIcon={<MapPin />}
        placeholder={placeholder}
        autoComplete="off"
        enterKeyHint="next"
        emptyMessage={labels.noMatches}
        loadingMessage={labels.searching}
        listLabel={labels.suggestions}
        resultsMessage={(count) => fill(labels.results, { count })}
      />
      {locate ? (
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="inline-flex min-h-11 w-fit cursor-pointer items-center gap-2 rounded-md text-sm font-semibold text-link focus-ring disabled:opacity-60"
        >
          <LocateFixed aria-hidden="true" className="size-4" />
          {locating ? labels.locating : labels.useMyLocation}
        </button>
      ) : null}
    </div>
  );
}
