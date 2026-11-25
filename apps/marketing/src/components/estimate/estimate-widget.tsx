"use client";

import { type FormEvent, useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { ChevronDown, MessageCircle } from "lucide-react";

import type { EstimateRequest, EstimateResponse } from "@truckbuck/types";
import { Button } from "@truckbuck/ui/button";
import { DatePicker, useTodayIST } from "@truckbuck/ui/date-picker";
import { Field } from "@truckbuck/ui/field";
import { Input } from "@truckbuck/ui/input";
import { formatINR, toISTDateKey } from "@truckbuck/utils";

import { currentPage, track } from "@/lib/analytics";
import { fill } from "@/lib/format";
import { markLeadSent } from "@/lib/lead-sent";

import { readUtm } from "../forms/attribution";
import { Turnstile } from "../forms/turnstile";
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
  /** Places filled in up front, e.g. on /truck-booking pages ("area:<slug>" ids). */
  prefill?: { from?: Place; to?: Place };
  /** A/B (widget_order): truck type before the route fields. DOM order, so focus order follows. */
  truckFirst?: boolean;
  /** A/B (primary_action): after the fare, lead with WhatsApp instead of the callback form. */
  whatsappFirst?: boolean;
}

// Result + lead step load only once someone asks for a price: they are not
// needed for first paint, and keeping them out of the initial bundle keeps
// the page light on budget Android phones. Prefetched when the form is used.
const loadResult = () => import("./estimate-result");
const loadLeadForm = () => import("./lead-form");
const EstimateResult = dynamic(() => loadResult().then((m) => m.EstimateResult), { ssr: false });
const LeadForm = dynamic(() => loadLeadForm().then((m) => m.LeadForm), { ssr: false });

/** Waits this long for an invisible Turnstile token before giving up. */
const TOKEN_WAIT_MS = 10_000;
/** Client-side memory of the 30-minute bot-check cookie (slightly shorter). */
const HUMAN_TTL_MS = 25 * 60_000;
let humanUntil = 0;

/** Anonymous estimate log (funnel + unserved demand): places are cut to city level server-side. */
function logEstimate(body: Record<string, unknown>) {
  const utm = readUtm();
  const payload = JSON.stringify({
    ...body,
    utm: { utm_source: utm.utm_source, utm_medium: utm.utm_medium, utm_campaign: utm.utm_campaign },
    page: window.location.pathname,
  });
  if (!navigator.sendBeacon("/api/events", new Blob([payload], { type: "application/json" }))) {
    void fetch("/api/events", { method: "POST", body: payload, keepalive: true }).catch(() => {});
  }
}

const EMPTY: InitialState = { from: null, to: null, truck: null, date: null };
const noopSubscribe = () => () => {};

/**
 * The fare widget. Prerendered empty (static page, fast LCP); after
 * hydration it reads ?from=&to=&truck=&date= once, so shared links restore
 * and price themselves. Reading location after hydration (instead of
 * useSearchParams + Suspense) avoids rendering the widget twice on load.
 */
export function EstimateWidget({
  labels,
  config,
  preselectedTruck,
  prefill,
  truckFirst = false,
  whatsappFirst = false,
}: EstimateWidgetProps) {
  const w = labels.widget;
  const today = useTodayIST();
  const search = useSyncExternalStore(
    noopSubscribe,
    () => window.location.search,
    () => "",
  );

  const [from, setFrom] = useState<Place | null>(prefill?.from ?? null);
  const [to, setTo] = useState<Place | null>(prefill?.to ?? null);
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

  // Bot check: Turnstile mounts on first use of the form (or a shared link),
  // never on page load. One solve sets a 30-minute cookie for /api/estimate.
  const [botCheck, setBotCheck] = useState({ armed: false, attempt: 0 });
  const token = useRef<string | null>(null);
  const waiters = useRef<((token: string | null) => void)[]>([]);
  const arm = () => setBotCheck((b) => (b.armed ? b : { ...b, armed: true }));
  function onToken(value: string | null) {
    token.current = value;
    if (value) {
      waiters.current.forEach((resolve) => resolve(value));
      waiters.current = [];
    }
  }

  async function ensureHuman(force = false): Promise<boolean> {
    if (!config.turnstileSiteKey) return true;
    if (!force && Date.now() < humanUntil) return true;
    if (force) {
      token.current = null;
      setBotCheck((b) => ({ armed: true, attempt: b.attempt + 1 }));
    } else arm();
    const value =
      token.current ??
      (await new Promise<string | null>((resolve) => {
        waiters.current.push(resolve);
        window.setTimeout(() => resolve(token.current), TOKEN_WAIT_MS);
      }));
    if (!value) return false;
    token.current = null; // single use
    const response = await fetch("/api/human", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: value }),
    });
    if (!response.ok) return false;
    humanUntil = Date.now() + HUMAN_TTL_MS;
    return true;
  }

  const started = useRef(false);
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
      const query = new URLSearchParams(
        Object.entries(body).map(([key, value]) => [key, String(value)]),
      ).toString();
      let response: Response | null = null;
      for (const force of [false, true]) {
        if (!(await ensureHuman(force))) break;
        response = await fetch(`/api/estimate?${query}`);
        // Cookie expired or was cleared: solve once more, then retry.
        if (response.status !== 403) break;
        humanUntil = 0;
      }
      if (!response) {
        setRequestError("bot_check");
        setEstimate(null);
        setStatus("idle");
        return;
      }
      const data = (await response.json().catch(() => ({}))) as {
        estimate?: EstimateResponse;
        error?: string;
      };
      if (!response.ok || !data.estimate) {
        const key = (data.error ??
          (response.status === 429 ? "rate_limited" : "unavailable")) as ErrorKey;
        track("estimate_failed", { reason: key, truck: next.truck });
        // Demand we couldn't price (not abuse/limits): kept for the unserved-routes report.
        if (!["rate_limited", "bot_check", "invalid"].includes(key)) {
          logEstimate({
            outcome: "failed",
            reason: key,
            from: { label: next.from.label },
            to: { label: next.to.label },
            truck: next.truck,
          });
        }
        setRequestError(key in labels.errors ? key : "unavailable");
        setEstimate(null);
        setStatus("idle");
        return;
      }
      setEstimate(data.estimate);
      setRequest(body);
      setStatus("done");
      const shown = data.estimate;
      const rupees = (paise: number | undefined) =>
        paise === undefined ? null : Math.round(paise / 100);
      track("estimate_shown", {
        distance_km: shown.distanceKm,
        truck: shown.truck.slug,
        fare_min: rupees(shown.quote?.fare.minPaise),
        fare_max: rupees(shown.quote?.fare.maxPaise),
        served: shown.served,
      });
      logEstimate({
        outcome: "shown",
        served: shown.served,
        from: { label: shown.from.label, lat: shown.from.lat, lng: shown.from.lng },
        to: { label: shown.to.label, lat: shown.to.lat, lng: shown.to.lng },
        truck: shown.truck.slug,
        distanceKm: Math.round(shown.distanceKm),
        ...(shown.quote
          ? {
              fareMin: Math.round(shown.quote.fare.minPaise / 100),
              fareMax: Math.round(shown.quote.fare.maxPaise / 100),
            }
          : {}),
      });

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
      track("estimate_failed", { reason: "network", truck: next.truck });
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
      if (a && b) {
        track("estimate_address_entered", { field: "pickup", method: "link" });
        track("estimate_address_entered", { field: "drop", method: "link" });
      }
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
        truckFirst && nextErrors.truck
          ? 'input[name="truck"]'
          : nextErrors.from
            ? "#estimate-from"
            : nextErrors.to
              ? "#estimate-to"
              : 'input[name="truck"]',
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

  const truckPicker = (
    <TruckPicker
      trucks={config.trucks}
      value={truck}
      onChange={(slug) => {
        setTruck(slug);
        track("estimate_truck_selected", { truck: slug });
        setErrors((e) => ({ ...e, truck: undefined }));
      }}
      legend={w.truck}
      specTemplate={w.truckSpec}
      error={errors.truck}
      errorId="estimate-truck-error"
    />
  );

  return (
    <div className="grid gap-6">
      <form
        data-clarity-mask="true"
        onSubmit={onSubmit}
        onFocus={() => {
          void loadResult();
          void loadLeadForm();
          arm();
          if (!started.current) {
            started.current = true;
            track("estimate_started", { page: currentPage() });
          }
        }}
        noValidate
        className="grid gap-4"
        aria-busy={status === "loading" || undefined}
      >
        {truckFirst ? truckPicker : null}
        <Field id="estimate-from" label={w.pickup} error={errors.from ?? locateError ?? undefined}>
          {(control) => (
            <PlaceField
              {...control}
              value={from}
              onChange={(place) => {
                setFrom(place);
                if (place) track("estimate_address_entered", { field: "pickup", method: "search" });
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
                if (place) track("estimate_address_entered", { field: "drop", method: "search" });
                setErrors((e) => ({ ...e, to: undefined }));
              }}
              placeholder={w.dropPlaceholder}
              labels={w}
            />
          )}
        </Field>

        {truckFirst ? null : truckPicker}

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

        {botCheck.armed && config.turnstileSiteKey ? (
          <Turnstile
            key={botCheck.attempt}
            siteKey={config.turnstileSiteKey}
            action="estimate"
            onToken={onToken}
          />
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
            {whatsappFirst && whatsappHref ? (
              <Button asChild variant="cta" size="lg" block>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener"
                  data-track-placement="estimate_primary"
                  onClick={markLeadSent}
                >
                  <MessageCircle aria-hidden="true" /> {labels.lead.whatsapp}
                </a>
              </Button>
            ) : null}
            <LeadForm
              key={`${request.from}-${request.to}-${request.truck}-${request.date}`}
              request={request}
              labels={labels}
              turnstileSiteKey={config.turnstileSiteKey}
              callbackMinutes={config.callbackMinutes}
              locale={config.locale}
              whatsappHref={whatsappFirst ? null : whatsappHref}
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
