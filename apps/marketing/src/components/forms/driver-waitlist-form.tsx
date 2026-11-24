"use client";

import { type FormEvent, useState, useTransition } from "react";

import type { LeadResult } from "@truckbuck/types";
import { Button } from "@truckbuck/ui/button";
import { Field } from "@truckbuck/ui/field";
import { Input } from "@truckbuck/ui/input";
import { PhoneInput } from "@truckbuck/ui/phone-input";
import { formatIndianMobile, normalizeIndianMobile } from "@truckbuck/utils";

import { submitDriverWaitlist } from "@/app/actions/leads";
import type { Content } from "@/content";
import type { Locale } from "@/i18n/locales";
import { fill } from "@/lib/format";

import { readUtm } from "./attribution";
import {
  Consent,
  FormError,
  Honeypot,
  SuccessPanel,
  useBotCheck,
  useFieldErrors,
} from "./form-kit";

export interface DriverWaitlistFormProps {
  labels: {
    form: Content["drivers"]["rewards"]["form"];
    forms: Content["forms"];
    common: Content["common"];
  };
  locale: Locale;
  privacyHref: string;
  turnstileSiteKey: string | null;
}

/** Rewards "coming soon" waitlist. Saved as a lead with type = "driver_waitlist". */
export function DriverWaitlistForm({
  labels,
  locale,
  privacyHref,
  turnstileSiteKey,
}: DriverWaitlistFormProps) {
  const { form: f, forms, common } = labels;
  const [submittedPhone, setSubmittedPhone] = useState("");
  const { errors, setErrors, clear } = useFieldErrors();
  const [result, setResult] = useState<LeadResult | null>(null);
  const [pending, startTransition] = useTransition();
  const { widget, getToken } = useBotCheck(turnstileSiteKey, "driver_waitlist");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const text = (key: string) => {
      const value = data.get(key);
      return typeof value === "string" ? value.trim() : "";
    };
    const name = text("name");
    const phone = text("phone");
    const city = text("city");
    const localErrors: Record<string, string> = {
      ...(name.length < 2 ? { name: forms.nameError } : {}),
      ...(normalizeIndianMobile(phone) ? {} : { phone: forms.phoneError }),
      ...(city.length < 2 ? { city: forms.cityError } : {}),
    };
    setErrors(localErrors);
    const first = Object.keys(localErrors)[0];
    if (first) {
      requestAnimationFrame(() => form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus());
      return;
    }
    startTransition(async () => {
      const outcome = await submitDriverWaitlist({
        name,
        phone,
        city,
        transporter: text("transporter") || undefined,
        website: text("website"),
        turnstileToken: await getToken(),
        utm: readUtm(),
        sourcePath: window.location.pathname,
        referrer: document.referrer || undefined,
        locale,
      }).catch((): LeadResult => ({ ok: false, reason: "unavailable" }));
      if (outcome.ok) setSubmittedPhone(formatIndianMobile(phone) ?? phone);
      else if (outcome.fieldErrors) setErrors(outcome.fieldErrors);
      setResult(outcome);
    });
  }

  if (result?.ok) {
    return (
      <SuccessPanel title={f.successTitle}>
        <p>
          {fill(f.successBody, {
            reference: result.reference,
            phone: submittedPhone,
          })}
        </p>
      </SuccessPanel>
    );
  }

  const formError =
    result && !result.ok && !result.fieldErrors ? forms.errors[result.reason] : null;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4" aria-busy={pending || undefined}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={forms.name} error={errors.name}>
          {(control) => (
            <Input {...control} name="name" autoComplete="name" onInput={() => clear("name")} />
          )}
        </Field>
        <Field label={forms.phone} error={errors.phone}>
          {(control) => (
            <PhoneInput {...control} name="phone" onValueChange={() => clear("phone")} />
          )}
        </Field>
        <Field label={forms.city} error={errors.city}>
          {(control) => (
            <Input
              {...control}
              name="city"
              autoComplete="address-level2"
              onInput={() => clear("city")}
            />
          )}
        </Field>
        <Field label={f.transporter} optional optionalLabel={common.optional}>
          {(control) => <Input {...control} name="transporter" autoComplete="organization" />}
        </Field>
      </div>
      <Honeypot />
      {widget}
      <FormError>{formError}</FormError>
      <div>
        <Button type="submit" variant="cta" size="lg" loading={pending}>
          {f.submit}
        </Button>
      </div>
      <Consent text={forms.consent} linkLabel={forms.privacyLink} href={privacyHref} />
    </form>
  );
}
