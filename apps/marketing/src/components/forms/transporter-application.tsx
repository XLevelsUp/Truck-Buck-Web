"use client";

import { type FormEvent, useRef, useState, useSyncExternalStore, useTransition } from "react";

import type { LeadResult } from "@truckbuck/types";
import { Button } from "@truckbuck/ui/button";
import { Field } from "@truckbuck/ui/field";
import { Input } from "@truckbuck/ui/input";
import { PhoneInput } from "@truckbuck/ui/phone-input";
import { Stepper } from "@truckbuck/ui/stepper";
import { formatIndianMobile, normalizeIndianMobile } from "@truckbuck/utils";

import { submitTransporterLead } from "@/app/actions/leads";
import type { Content } from "@/content";
import { track } from "@/lib/analytics";
import { fill } from "@/lib/format";

import { readUtm } from "./attribution";
import {
  ChoiceChips,
  Consent,
  FormError,
  Honeypot,
  markLeadSent,
  SuccessPanel,
  Textarea,
  useBotCheck,
  useFieldErrors,
  WhatsappButton,
} from "./form-kit";

const STORAGE_KEY = "tb.transporter-application.v1";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

interface Draft {
  step: 0 | 1;
  name: string;
  phone: string;
  city: string;
  fleetSize: string;
  truckTypes: string[];
  homeBase: string;
  lanes: string;
  savedAt: number;
}

const EMPTY: Draft = {
  step: 0,
  name: "",
  phone: "",
  city: "",
  fleetSize: "",
  truckTypes: [],
  homeBase: "",
  lanes: "",
  savedAt: 0,
};

function readDraft(raw: string | null): Draft | null {
  if (!raw) return null;
  try {
    const draft = { ...EMPTY, ...(JSON.parse(raw) as Partial<Draft>) };
    return Date.now() - draft.savedAt < MAX_AGE_MS ? draft : null;
  } catch {
    return null;
  }
}

/** Current answers, straight from the DOM (includes anything typed before hydration). */
function readForm(form: HTMLFormElement, step: 0 | 1): Draft {
  const data = new FormData(form);
  const text = (key: string) => {
    const value = data.get(key);
    return typeof value === "string" ? value.trim() : "";
  };
  return {
    step,
    name: text("name"),
    phone: text("phone"),
    city: text("city"),
    fleetSize: text("fleetSize"),
    truckTypes: data.getAll("truckTypes").filter((v): v is string => typeof v === "string"),
    homeBase: text("homeBase"),
    lanes: text("lanes"),
    savedAt: Date.now(),
  };
}

const noopSubscribe = () => () => {};
function readStorage(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStorage(draft: Draft | null) {
  try {
    if (draft) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked (private mode): the form still works, it just won't resume.
  }
}

export interface TransporterApplicationProps {
  labels: {
    form: Content["transporters"]["form"];
    forms: Content["forms"];
    common: Content["common"];
  };
  trucks: { slug: string; name: string }[];
  privacyHref: string;
  turnstileSiteKey: string | null;
  whatsappNumber: string | null;
  locale: "en" | "hi" | "ta";
}

/**
 * Two short steps, no login. Inputs are uncontrolled — the DOM is the source
 * of truth — so answers typed before React hydrates on a slow phone are
 * never lost. Every change is saved to localStorage so the application
 * survives closing the tab (drafts expire after 30 days; cleared on
 * success). Documents are collected later on WhatsApp, not here.
 */
export function TransporterApplication({
  labels,
  trucks,
  privacyHref,
  turnstileSiteKey,
  whatsappNumber,
  locale,
}: TransporterApplicationProps) {
  const { form: f, forms, common } = labels;
  const [step, setStep] = useState<0 | 1>(0);
  const [initial, setInitial] = useState<Draft>(EMPTY);
  const [formKey, setFormKey] = useState(0);
  const [restored, setRestored] = useState<"pending" | "fresh" | "restored">("pending");

  // undefined on the server and during hydration; string | null on the client.
  const stored = useSyncExternalStore(noopSubscribe, readStorage, () => undefined);
  if (restored === "pending" && stored !== undefined) {
    const saved = readDraft(stored);
    if (saved && (saved.name || saved.phone || saved.city)) {
      setInitial(saved);
      setStep(saved.step);
      setFormKey((key) => key + 1); // remount inputs with the saved defaults
      setRestored("restored");
    } else {
      setRestored("fresh");
    }
  }

  const { errors, setErrors, clear } = useFieldErrors();
  const [result, setResult] = useState<LeadResult | null>(null);
  const [submittedPhone, setSubmittedPhone] = useState("");
  const [pending, startTransition] = useTransition();
  const { widget, getToken } = useBotCheck(turnstileSiteKey, "transporter_apply");
  const formRef = useRef<HTMLFormElement>(null);
  const stepHeading = useRef<HTMLHeadingElement>(null);

  function save(nextStep: 0 | 1 = step) {
    if (formRef.current) writeStorage(readForm(formRef.current, nextStep));
  }

  function goTo(next: 0 | 1) {
    setStep(next);
    save(next);
    requestAnimationFrame(() => stepHeading.current?.focus());
  }

  function focusField(form: HTMLFormElement, field: string) {
    requestAnimationFrame(() => form.querySelector<HTMLElement>(`[name="${field}"]`)?.focus());
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = readForm(form, step);

    if (step === 0) {
      const stepErrors: Record<string, string> = {
        ...(values.name.length < 2 ? { name: forms.nameError } : {}),
        ...(normalizeIndianMobile(values.phone) ? {} : { phone: forms.phoneError }),
        ...(values.city.length < 2 ? { city: forms.cityError } : {}),
      };
      setErrors(stepErrors);
      const first = Object.keys(stepErrors)[0];
      if (first) focusField(form, first);
      else {
        track("transporter_step_completed", { step: 1 });
        goTo(1);
      }
      return;
    }

    const stepErrors: Record<string, string> = {
      ...(values.fleetSize ? {} : { fleetSize: f.fleetSizeError }),
      ...(values.truckTypes.length > 0 ? {} : { truckTypes: f.truckTypesError }),
      ...(values.homeBase.length < 2 ? { homeBase: f.homeBaseError } : {}),
    };
    setErrors(stepErrors);
    const first = Object.keys(stepErrors)[0];
    if (first) {
      focusField(form, first);
      return;
    }

    const website = new FormData(form).get("website");
    startTransition(async () => {
      const outcome = await submitTransporterLead({
        name: values.name,
        phone: values.phone,
        city: values.city,
        fleetSize: values.fleetSize,
        truckTypes: values.truckTypes,
        homeBase: values.homeBase,
        lanes: values.lanes || undefined,
        website: typeof website === "string" ? website : "",
        turnstileToken: await getToken(),
        utm: readUtm(),
        sourcePath: window.location.pathname,
        referrer: document.referrer || undefined,
        locale,
      }).catch((): LeadResult => ({ ok: false, reason: "unavailable" }));

      if (outcome.ok) {
        writeStorage(null);
        track("transporter_step_completed", { step: 2 });
        track("transporter_submitted", { fleet_size: values.fleetSize });
        markLeadSent();
        setSubmittedPhone(formatIndianMobile(values.phone) ?? values.phone);
      } else if (outcome.fieldErrors) {
        setErrors(outcome.fieldErrors);
        if (
          Object.keys(outcome.fieldErrors).some((key) => ["name", "phone", "city"].includes(key))
        ) {
          goTo(0);
        }
      }
      setResult(outcome);
    });
  }

  if (result?.ok) {
    const ackText = fill(f.whatsappAckText, { reference: result.reference });
    return (
      <SuccessPanel
        title={f.successTitle}
        actions={
          whatsappNumber ? (
            <WhatsappButton
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(ackText)}`}
              label={f.whatsappAck}
            />
          ) : null
        }
      >
        <p>{fill(f.successBody, { reference: result.reference, phone: submittedPhone })}</p>
        <p>{f.whatsappNext}</p>
      </SuccessPanel>
    );
  }

  const formError =
    result && !result.ok && !result.fieldErrors ? forms.errors[result.reason] : null;

  return (
    <form
      data-clarity-mask="true"
      key={formKey}
      ref={formRef}
      onSubmit={onSubmit}
      onChange={(event) => {
        const target = event.target;
        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
          if (target.name) clear(target.name);
        }
        save();
      }}
      noValidate
      className="grid gap-5"
      aria-busy={pending || undefined}
    >
      <Stepper
        steps={f.steps}
        current={step}
        stepLabel={(index, total) => fill(common.stepOf, { current: index, total })}
        completedLabel={common.completed}
      />
      {restored === "restored" ? (
        <p
          role="status"
          className="rounded-lg bg-info-soft px-3 py-2 text-sm text-info-soft-foreground"
        >
          {f.restored}
        </p>
      ) : null}

      <h3 ref={stepHeading} tabIndex={-1} className="text-xl font-bold outline-none">
        {f.steps[step]}
      </h3>

      {/* Both steps stay in the DOM (inactive one hidden) so FormData always has every answer. */}
      <div className="grid gap-4" hidden={step !== 0}>
        <Field label={forms.ownerName} error={errors.name}>
          {(control) => (
            <Input
              {...control}
              name="name"
              autoComplete="name"
              enterKeyHint="next"
              defaultValue={initial.name}
            />
          )}
        </Field>
        <Field label={forms.phone} error={errors.phone}>
          {(control) => (
            <PhoneInput
              {...control}
              name="phone"
              enterKeyHint="next"
              defaultValue={initial.phone}
            />
          )}
        </Field>
        <Field label={forms.city} error={errors.city}>
          {(control) => (
            <Input
              {...control}
              name="city"
              autoComplete="address-level2"
              enterKeyHint="go"
              defaultValue={initial.city}
            />
          )}
        </Field>
      </div>

      <div className="grid gap-5" hidden={step !== 1}>
        <ChoiceChips
          legend={f.fleetSize}
          name="fleetSize"
          options={f.fleetSizeOptions}
          defaultValue={initial.fleetSize ? [initial.fleetSize] : []}
          error={errors.fleetSize}
        />
        <ChoiceChips
          legend={f.truckTypes}
          hint={f.truckTypesHint}
          name="truckTypes"
          multiple
          options={trucks.map((t) => ({ value: t.slug, label: t.name }))}
          defaultValue={initial.truckTypes}
          error={errors.truckTypes}
        />
        <Field label={f.homeBase} hint={f.homeBaseHint} error={errors.homeBase}>
          {(control) => (
            <Input
              {...control}
              name="homeBase"
              autoComplete="address-level2"
              defaultValue={initial.homeBase}
            />
          )}
        </Field>
        <Field label={f.lanes} hint={f.lanesHint} optional optionalLabel={common.optional}>
          {(control) => (
            <Textarea {...control} name="lanes" maxLength={500} defaultValue={initial.lanes} />
          )}
        </Field>
      </div>

      <Honeypot />
      {step === 1 ? widget : null}
      <FormError>{formError}</FormError>

      <div className="flex flex-wrap items-center gap-3">
        {step === 1 ? (
          <Button variant="secondary" size="lg" onClick={() => goTo(0)}>
            {f.back}
          </Button>
        ) : null}
        <Button
          type="submit"
          variant="cta"
          size="lg"
          loading={pending}
          className="flex-1 md:flex-none"
        >
          {step === 0 ? f.next : f.submit}
        </Button>
      </div>
      <Consent text={forms.consent} linkLabel={forms.privacyLink} href={privacyHref} />
    </form>
  );
}
