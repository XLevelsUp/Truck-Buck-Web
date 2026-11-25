"use client";

import { type FormEvent, useState, useTransition } from "react";

import type { LeadResult } from "@truckbuck/types";
import { Button } from "@truckbuck/ui/button";
import { Field } from "@truckbuck/ui/field";
import { Input } from "@truckbuck/ui/input";
import { PhoneInput } from "@truckbuck/ui/phone-input";
import { formatIndianMobile, isValidGstin, normalizeIndianMobile } from "@truckbuck/utils";

import { submitBusinessLead } from "@/app/actions/leads";
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
} from "./form-kit";

export interface BusinessAccountFormProps {
  labels: { form: Content["shippers"]["form"]; forms: Content["forms"]; common: Content["common"] };
  privacyHref: string;
  turnstileSiteKey: string | null;
}

/** /shippers — "Business account" request. Saved as a lead with type = "business". */
export function BusinessAccountForm({
  labels,
  privacyHref,
  turnstileSiteKey,
}: BusinessAccountFormProps) {
  const { form: f, forms, common } = labels;
  const [submittedPhone, setSubmittedPhone] = useState("");
  const { errors, setErrors, clear } = useFieldErrors();
  const [result, setResult] = useState<LeadResult | null>(null);
  const [pending, startTransition] = useTransition();
  const { widget, getToken } = useBotCheck(turnstileSiteKey, "business_account");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const text = (key: string) => {
      const value = data.get(key);
      return typeof value === "string" ? value.trim() : "";
    };
    const values = {
      company: text("company"),
      gstin: text("gstin").toUpperCase(),
      lanes: text("lanes"),
      name: text("name"),
      email: text("email"),
    };
    const phone = text("phone");
    const monthlyTrips = text("monthlyTrips");

    const localErrors: Record<string, string> = {
      ...(values.company.length < 2 ? { company: forms.required } : {}),
      ...(values.gstin && !isValidGstin(values.gstin) ? { gstin: f.gstinError } : {}),
      ...(monthlyTrips ? {} : { monthlyTrips: forms.required }),
      ...(values.lanes.length < 3 ? { lanes: f.lanesError } : {}),
      ...(values.name.length < 2 ? { name: forms.nameError } : {}),
      ...(normalizeIndianMobile(phone) ? {} : { phone: forms.phoneError }),
    };
    setErrors(localErrors);
    const first = Object.keys(localErrors)[0];
    if (first) {
      requestAnimationFrame(() => form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus());
      return;
    }

    startTransition(async () => {
      const outcome = await submitBusinessLead({
        ...values,
        phone,
        monthlyTrips,
        website: text("website"),
        turnstileToken: await getToken(),
        utm: readUtm(),
        sourcePath: window.location.pathname,
        referrer: document.referrer || undefined,
        locale: "en",
      }).catch((): LeadResult => ({ ok: false, reason: "unavailable" }));
      if (outcome.ok) {
        setSubmittedPhone(formatIndianMobile(phone) ?? phone);
        track("business_enquiry_submitted", {});
        markLeadSent();
      } else if (outcome.fieldErrors) setErrors(outcome.fieldErrors);
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
    <form
      data-clarity-mask="true"
      onSubmit={onSubmit}
      noValidate
      className="grid gap-5"
      aria-busy={pending || undefined}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={f.company} error={errors.company}>
          {(control) => (
            <Input
              {...control}
              name="company"
              autoComplete="organization"
              onInput={() => clear("company")}
            />
          )}
        </Field>
        <Field
          label={f.gstin}
          hint={f.gstinHint}
          error={errors.gstin}
          optional
          optionalLabel={common.optional}
        >
          {(control) => (
            <Input
              {...control}
              name="gstin"
              maxLength={15}
              autoCapitalize="characters"
              spellCheck={false}
              className="uppercase"
              onInput={() => clear("gstin")}
            />
          )}
        </Field>
      </div>
      <ChoiceChips
        legend={f.monthlyTrips}
        name="monthlyTrips"
        options={f.monthlyTripsOptions}
        onChange={() => clear("monthlyTrips")}
        error={errors.monthlyTrips}
      />
      <Field label={f.lanes} hint={f.lanesHint} error={errors.lanes}>
        {(control) => (
          <Textarea {...control} name="lanes" maxLength={500} onInput={() => clear("lanes")} />
        )}
      </Field>

      <fieldset className="grid gap-4">
        <legend className="mb-2 text-lg font-bold">{f.contactTitle}</legend>
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
          <Field label={forms.email} optional optionalLabel={common.optional}>
            {(control) => <Input {...control} name="email" type="email" autoComplete="email" />}
          </Field>
        </div>
      </fieldset>

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
