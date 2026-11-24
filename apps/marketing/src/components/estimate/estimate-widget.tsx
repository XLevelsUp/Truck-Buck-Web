"use client";

import { type FormEvent, useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { ChevronDown } from "lucide-react";

import type { EstimateRequest, EstimateResponse } from "@truckbuck/types";
import { Button } from "@truckbuck/ui/button";
import { DatePicker, useTodayIST } from "@truckbuck/ui/date-picker";
import { Field } from "@truckbuck/ui/field";
import { Input } from "@truckbuck/ui/input";
import { formatINR, toISTDateKey } from "@truckbuck/utils";

import { fill } from "@/lib/format";

import type { WidgetConfig, WidgetLabels } from "./labels";
import { type Place, PlaceField } from "./place-field";
import { TruckPicker } from "./truck-picker";

type ErrorKey = keyof WidgetLabels["errors"];

interface InitialState {
  from: string | null;
  to: string | null;
  truck: string | null;
  date: string | null;
}

interface FieldErrors {
  from?: string | undefined;
  to?: string | undefined;
  truck?: string | undefined;
}

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function readInitial(params: URLSearchParams | null): InitialState {
  const get = (key: string, pattern?: RegExp) => {
    const value = params?.get(key)?.slice(0, 512) ?? null;
    return value && (!pattern || pattern.test(value)) ? value : null;
  };
  return { from: get("from"), to: get("to"), truck: get("truck", SLUG), date: get("date", DATE) };
}

async function fetchPlace(placeId: string): Promise<Place | null> {
  const response = await fetch(
    `/api/places/details?${new URLSearchParams({ id: placeId }).toString()}`,
  );
  if (!response.ok) return null;
  const { place } = (await response.json()) as { place: Place };
  return { placeId: place.placeId, label: place.label };
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface EstimateWidgetProps {
  labels: WidgetLabels;
  config: WidgetConfig;
  /** Truck chosen up front, e.g. on a /trucks/[slug] page. */
  preselectedTruck?: string;
}

// Result + lead step load only once someone asks for a price: they are not
// needed for first paint, and keeping them out of the initial bundle keeps
// the page light on budget Android phones. Prefetched when the form is used.
const loadResult = () => import("./estimate-result");
const loadLeadForm = () => import("./lead-form");
const EstimateResult = dynamic(() => loadResult().then((m) => m.EstimateResult), { ssr: false });
const LeadForm = dynamic(() => loadLeadForm().then((m) => m.LeadForm), { ssr: false });

const EMPTY: InitialState = { from: null, to: null, truck: null, date: null };
const noopSubscribe = () => () => {};

/**
 * The fare widget. Prerendered empty (static page, fast LCP); after
 * hydration it reads ?from=&to=&truck=&date= once, so shared links restore
 * and price themselves. Reading location after hydration (instead of
 * useSearchParams + Suspense) avoids rendering the widget twice on load.
 */
export function EstimateWidget({ labels, config, preselectedTruck }: EstimateWidgetProps) {
  const w = labels.widget;
  const today = useTodayIST();
  const search = useSyncExternalStore(
    noopSubscribe,
    () => window.location.search,
    () => "",
  );

  const [from, setFrom] = useState<Place | null>(null);
  const [to, setTo] = useState<Place | null>(null);
  const [truck, setTruck] = useState<string | null>(preselectedTruck ?? null);
  const [date, setDate] = useState("");
  const [initial, setInitial] = useState<InitialState>(EMPTY);

  // Apply the URL once, during render (React's "adjust state on change" pattern).
  const [appliedSearch, setAppliedSearch] = useState<string | null>(null);
  if (search && appliedSearch === null) {
    const parsed = readInitial(new URLSearchParams(search));
    setAppliedSearch(search);
    setInitial(parsed);
    if (parsed.truck && config.trucks.some((t) => t.slug === parsed.truck)) setTruck(parsed.truck);
    if (parsed.date) setDate(parsed.date);
  }
  const [weight, setWeight] = useState("");
  const [material, setMaterial] = useState("");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [locateError, setLocateError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [requestError, setRequestError] = useState<ErrorKey | null>(null);
  const [estimate, setEstimate] = useState<EstimateResponse | null>(null);
  const [request, setRequest] = useState<EstimateRequest | null>(null);

  const resultHeading = useRef<HTMLHeadingElement>(null);
  const resultRegion = useRef<HTMLDivElement>(null);

  const effectiveDate = date || today || "";

  async function run(next: { from: Place; to: Place; truck: string; date: string }) {
    const body: EstimateRequest = {
      from: next.from.placeId,
      to: next.to.placeId,
      truck: next.truck,
      date: next.date,
      ...(Number(weight) > 0 ? { weightTonnes: Number(weight) } : {}),
      ...(material.trim() ? { material: material.trim() } : {}),
    };
    setStatus("loading");
    setRequestError(null);
    try {
      const response = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json().catch(() => ({}))) as {
        estimate?: EstimateResponse;
        error?: string;
      };
      if (!response.ok || !data.estimate) {
        const key = (data.error ??
          (response.status === 429 ? "rate_limited" : "unavailable")) as ErrorKey;
        setRequestError(key in labels.errors ? key : "unavailable");
        setEstimate(null);
        setStatus("idle");
        return;
      }
      setEstimate(data.estimate);
      setRequest(body);
      setStatus("done");

      // Shareable state: /?from=&to=&truck=&date= (no personal data).
      const url = new URL(window.location.href);
      url.search = new URLSearchParams({
        from: body.from,
        to: body.to,
        truck: body.truck,
        date: body.date,
      }).toString();
      window.history.replaceState(window.history.state, "", url);

      requestAnimationFrame(() => {
        resultRegion.current?.scrollIntoView({
          behavior: prefersReducedMotion() ? "auto" : "smooth",
          block: "start",
        });
        resultHeading.current?.focus({ preventScroll: true });
      });
    } catch {
      setRequestError("network");
      setStatus("idle");
    }
  }

  // Shared link: restore places from their ids, then price it once.
  useEffect(() => {
    const { from: fromId, to: toId, truck: truckSlug, date: linkDate } = initial;
    if (!fromId || !toId) return;
    let cancelled = false;
    void Promise.all([fetchPlace(fromId), fetchPlace(toId)]).then(([a, b]) => {
      if (cancelled) return;
      if (a) setFrom(a);
      if (b) setTo(b);
      if (a && b && truckSlug && config.trucks.some((t) => t.slug === truckSlug)) {
        const today = toISTDateKey(Date.now());
        void run({
          from: a,
          to: b,
          truck: truckSlug,
          date: linkDate && linkDate >= today ? linkDate : today,
        });
      }
    });
    return () => {
      cancelled = true;
    };
    // Runs once per applied URL; `run` and `config` are stable for that purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see above
  }, [initial]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!from) nextErrors.from = w.missingPickup;
    if (!to) nextErrors.to = w.missingDrop;
    if (from && to && from.placeId === to.placeId) nextErrors.to = w.samePlace;
    if (!truck) nextErrors.truck = w.missingTruck;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !from || !to || !truck) {
      const first = event.currentTarget.querySelector<HTMLElement>(
        nextErrors.from ? "#estimate-from" : nextErrors.to ? "#estimate-to" : 'input[name="truck"]',
      );
      first?.focus();
      return;
    }
    void run({ from, to, truck, date: effectiveDate });
  }

  function reset() {
    setEstimate(null);
    setRequest(null);
    setStatus("idle");
    window.history.replaceState(window.history.state, "", window.location.pathname + "#get-price");
    document.getElementById("estimate-from")?.focus();
  }

  const whatsappHref =
    config.whatsappNumber && estimate
      ? `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(
          [
            labels.whatsapp.quoteIntro,
            `${labels.whatsapp.route}: ${estimate.from.label} → ${estimate.to.label}`,
            `${labels.whatsapp.truck}: ${estimate.truck.name}`,
            `${labels.whatsapp.date}: ${estimate.date}`,
            `${labels.whatsapp.distance}: ${estimate.distanceKm} km`,
            estimate.quote
              ? `${labels.whatsapp.estimate}: ${formatINR(estimate.quote.fare.minPaise, { wholeRupees: true })} – ${formatINR(estimate.quote.fare.maxPaise, { wholeRupees: true })}`
              : null,
            `${labels.whatsapp.link}: ${window.location.href}`,
          ]
            .filter(Boolean)
            .join("\n"),
        )}`
      : null;

  return (
    <div className="grid gap-6">
      <form
        onSubmit={onSubmit}
        onFocus={() => {
          void loadResult();
          void loadLeadForm();
        }}
        noValidate
        className="grid gap-4"
        aria-busy={status === "loading" || undefined}
      >
        <Field id="estimate-from" label={w.pickup} error={errors.from ?? locateError ?? undefined}>
          {(control) => (
            <PlaceField
              {...control}
              value={from}
              onChange={(place) => {
                setFrom(place);
                setLocateError(null);
                setErrors((e) => ({ ...e, from: undefined }));
              }}
              placeholder={w.pickupPlaceholder}
              labels={w}
              locate
              onLocateError={setLocateError}
            />
          )}
        </Field>
        <Field id="estimate-to" label={w.drop} error={errors.to}>
          {(control) => (
            <PlaceField
              {...control}
              value={to}
              onChange={(place) => {
                setTo(place);
                setErrors((e) => ({ ...e, to: undefined }));
              }}
              placeholder={w.dropPlaceholder}
              labels={w}
            />
          )}
        </Field>

        <TruckPicker
          trucks={config.trucks}
          value={truck}
          onChange={(slug) => {
            setTruck(slug);
            setErrors((e) => ({ ...e, truck: undefined }));
          }}
          legend={w.truck}
          specTemplate={w.truckSpec}
          error={errors.truck}
          errorId="estimate-truck-error"
        />

        <Field label={w.when}>
          {(control) => (
            <DatePicker
              {...control}
              value={effectiveDate}
              onValueChange={setDate}
              quickPicks={[
                { label: w.today, daysFromToday: 0 },
                { label: w.tomorrow, daysFromToday: 1 },
              ]}
            />
          )}
        </Field>

        <details className="group rounded-lg">
          <summary className="flex min-h-11 w-fit cursor-pointer list-none items-center gap-2 rounded-md font-semibold text-link focus-ring [&::-webkit-details-marker]:hidden">
            {w.more} <span className="font-normal text-muted-foreground">({w.optional})</span>
            <ChevronDown
              aria-hidden="true"
              className="size-4 transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <Field label={w.weight} optional optionalLabel={w.optional}>
              {(control) => (
                <Input
                  {...control}
                  type="number"
                  inputMode="decimal"
                  min={0.1}
                  max={60}
                  step={0.1}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              )}
            </Field>
            <Field label={w.material} optional optionalLabel={w.optional}>
              {(control) => (
                <Input
                  {...control}
                  maxLength={80}
                  placeholder={w.materialPlaceholder}
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                />
              )}
            </Field>
          </div>
        </details>

        {requestError ? (
          <p role="alert" className="font-medium text-danger">
            {labels.errors[requestError]}
          </p>
        ) : null}

        <Button type="submit" variant="cta" size="lg" block loading={status === "loading"}>
          {w.submit}
        </Button>
      </form>

      <div ref={resultRegion} aria-live="polite" className="scroll-mt-20">
        {estimate && request ? (
          <div className="grid gap-6 border-t pt-6">
            <EstimateResult
              estimate={estimate}
              labels={labels}
              embedKey={config.mapsEmbedKey}
              headingRef={resultHeading}
            />
            <LeadForm
              key={`${request.from}-${request.to}-${request.truck}-${request.date}`}
              request={request}
              labels={labels}
              turnstileSiteKey={config.turnstileSiteKey}
              callbackMinutes={config.callbackMinutes}
              locale={config.locale}
              whatsappHref={whatsappHref}
              onReset={reset}
            />
            <Button variant="link" onClick={reset} className="justify-self-start">
              {labels.result.edit}
            </Button>
          </div>
        ) : null}
        {/* An estimate that failed still lets people leave a number. */}
        {!estimate && requestError === "unavailable" && from && to && truck ? (
          <div className="grid gap-4 border-t pt-6">
            <p className="text-muted-foreground">{fill(labels.result.unpricedBody, {})}</p>
            <LeadForm
              request={{ from: from.placeId, to: to.placeId, truck, date: effectiveDate }}
              labels={labels}
              turnstileSiteKey={config.turnstileSiteKey}
              callbackMinutes={config.callbackMinutes}
              locale={config.locale}
              whatsappHref={null}
              onReset={reset}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
