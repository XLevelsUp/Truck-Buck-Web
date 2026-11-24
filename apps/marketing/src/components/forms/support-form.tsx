"use client";

import { type FormEvent, useState, useTransition } from "react";

import type { LeadResult } from "@truckbuck/types";
import { Button } from "@truckbuck/ui/button";
import { Field } from "@truckbuck/ui/field";
import { Input } from "@truckbuck/ui/input";
import { PhoneInput } from "@truckbuck/ui/phone-input";
import { formatIndianMobile, normalizeIndianMobile } from "@truckbuck/utils";

import { submitContactLead, submitGrievance } from "@/app/actions/leads";
import type { Content } from "@/content";
import { fill } from "@/lib/format";

import { readUtm } from "./attribution";
import {
  ChoiceChips,
  Consent,
  FormError,
  Honeypot,
  SuccessPanel,
  Textarea,
  useBotCheck,
  useFieldErrors,
} from "./form-kit";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface SupportFormProps {
  /** "contact" → /contact (type contact); "grievance" → /grievance (grievance / account_deletion). */
  mode: "contact" | "grievance";
  labels: { support: Content["support"]; forms: Content["forms"]; common: Content["common"] };
  privacyHref: string;
  turnstileSiteKey: string | null;
  /** Preselected topic, e.g. from /contact?topic=press. */
  defaultTopic?: string;
}

/**
 * One form for /contact and /grievance. Uncontrolled (FormData), so input
 * typed before hydration on a slow phone is kept. Validated here for fast
 * feedback and again with zod on the server.
 */
export function SupportForm({
  mode,
  labels,
  privacyHref,
  turnstileSiteKey,
  defaultTopic,
}: SupportFormProps) {
  const { support: s, forms, common } = labels;
  const [submittedPhone, setSubmittedPhone] = useState("");
  const { errors, setErrors, clear } = useFieldErrors();
  const [result, setResult] = useState<LeadResult | null>(null);
  const [pending, startTransition] = useTransition();
  const { widget, getToken } = useBotCheck(turnstileSiteKey, mode);
  const choiceName = mode === "contact" ? "topic" : "kind";

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const text = (key: string) => {
      const value = data.get(key);
      return typeof value === "string" ? value.trim() : "";
    };
    const values = {
      name: text("name"),
      phone: text("phone"),
      email: text("email"),
      message: text("message"),
      choice: text(choiceName),
    };

    const localErrors: Record<string, string> = {
      ...(values.choice ? {} : { [choiceName]: forms.required }),
      ...(values.message.length < 10 ? { message: s.messageError } : {}),
      ...(values.name.length < 2 ? { name: forms.nameError } : {}),
      ...(normalizeIndianMobile(values.phone) ? {} : { phone: forms.phoneError }),
      ...(values.email && !EMAIL.test(values.email) ? { email: s.emailError } : {}),
    };
    setErrors(localErrors);
    const first = Object.keys(localErrors)[0];
    if (first) {
      requestAnimationFrame(() => form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus());
      return;
    }

    startTransition(async () => {
      const shared = {
        name: values.name,
        phone: values.phone,
        email: values.email,
        message: values.message,
        website: text("website"),
        turnstileToken: await getToken(),
        utm: readUtm(),
        sourcePath: window.location.pathname,
        referrer: document.referrer || undefined,
        locale: "en" as const,
      };
      const submit =
        mode === "contact"
          ? submitContactLead({ ...shared, topic: values.choice, company: text("company") })
          : submitGrievance({
              ...shared,
              kind: values.choice,
              reference: text("reference") || undefined,
            });
      const outcome = await submit.catch((): LeadResult => ({ ok: false, reason: "unavailable" }));
      if (outcome.ok) setSubmittedPhone(formatIndianMobile(values.phone) ?? values.phone);
      else if (outcome.fieldErrors) setErrors(outcome.fieldErrors);
      setResult(outcome);
    });
  }

  if (result?.ok) {
    const grievance = mode === "grievance";
    return (
      <SuccessPanel title={grievance ? s.grievanceSuccessTitle : s.successTitle}>
        <p>
          {fill(grievance ? s.grievanceSuccessBody : s.successBody, {
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
    <form onSubmit={onSubmit} noValidate className="grid gap-5" aria-busy={pending || undefined}>
      <ChoiceChips
        legend={mode === "contact" ? s.topic : s.kind}
        name={choiceName}
        options={mode === "contact" ? s.topics : s.kinds}
        defaultValue={defaultTopic ? [defaultTopic] : []}
        onChange={() => clear(choiceName)}
        error={errors[choiceName]}
      />
      <Field label={s.message} hint={s.messageHint} error={errors.message}>
        {(control) => (
          <Textarea
            {...control}
            name="message"
            rows={4}
            maxLength={2000}
            onInput={() => clear("message")}
          />
        )}
      </Field>
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
        <Field label={forms.email} error={errors.email} optional optionalLabel={common.optional}>
          {(control) => (
            <Input
              {...control}
              name="email"
              type="email"
              autoComplete="email"
              onInput={() => clear("email")}
            />
          )}
        </Field>
        {mode === "contact" ? (
          <Field label={s.company} optional optionalLabel={common.optional}>
            {(control) => <Input {...control} name="company" autoComplete="organization" />}
          </Field>
        ) : (
          <Field
            label={s.reference}
            hint={s.referenceHint}
            optional
            optionalLabel={common.optional}
          >
            {(control) => <Input {...control} name="reference" maxLength={40} />}
          </Field>
        )}
      </div>

      <Honeypot />
      {widget}
      <FormError>{formError}</FormError>
      <div>
        <Button type="submit" variant="cta" size="lg" loading={pending}>
          {mode === "contact" ? s.submit : s.submitGrievance}
        </Button>
      </div>
      <Consent text={forms.consent} linkLabel={forms.privacyLink} href={privacyHref} />
    </form>
  );
}
