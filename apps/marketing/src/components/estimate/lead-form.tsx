"use client";

import { type FormEvent, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, MessageCircle } from "lucide-react";

import type { EstimateRequest, LeadResult } from "@truckbuck/types";
import { Button } from "@truckbuck/ui/button";
import { Field } from "@truckbuck/ui/field";
import { Input } from "@truckbuck/ui/input";
import { PhoneInput } from "@truckbuck/ui/phone-input";
import { formatIndianMobile, normalizeIndianMobile } from "@truckbuck/utils";

import { submitQuoteLead } from "@/app/actions/quote-lead";
import { readUtm } from "@/components/forms/attribution";
import { Turnstile } from "@/components/forms/turnstile";
import { fill } from "@/lib/format";

import type { WidgetLabels } from "./labels";

interface LeadFormProps {
  request: EstimateRequest;
  labels: WidgetLabels;
  turnstileSiteKey: string | null;
  callbackMinutes: number | null;
  whatsappHref: string | null;
  onReset: () => void;
  locale: "en" | "hi" | "ta";
}

const TOKEN_WAIT_MS = 10_000;

/** Step 2: name + phone → callback. One tap after typing. */
export function LeadForm({
  request,
  labels,
  turnstileSiteKey,
  callbackMinutes,
  whatsappHref,
  onReset,
  locale,
}: LeadFormProps) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<LeadResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [submittedPhone, setSubmittedPhone] = useState("");
  const token = useRef<string | null>(null);
  const waiters = useRef<((value: string | null) => void)[]>([]);

  function onToken(value: string | null) {
    token.current = value;
    if (value) {
      waiters.current.forEach((resolve) => resolve(value));
      waiters.current = [];
    }
  }

  function waitForToken(): Promise<string | null> {
    if (!turnstileSiteKey || token.current) return Promise.resolve(token.current);
    return new Promise((resolve) => {
      waiters.current.push(resolve);
      window.setTimeout(() => resolve(token.current), TOKEN_WAIT_MS);
    });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const field = (key: string) => {
      const value = data.get(key);
      return typeof value === "string" ? value : "";
    };
    const phone = field("phone");
    const name = field("name").trim();

    // Instant feedback before the bot check and the round trip; the server validates again.
    const localErrors = {
      ...(name.length < 2 ? { name: labels.lead.nameError } : {}),
      ...(normalizeIndianMobile(phone) ? {} : { phone: labels.lead.phoneError }),
    };
    if (localErrors.name || localErrors.phone) {
      setResult({ ok: false, reason: "invalid", fieldErrors: localErrors });
      const form = event.currentTarget;
      requestAnimationFrame(() =>
        form
          .querySelector<HTMLInputElement>(
            localErrors.name ? 'input[name="name"]' : 'input[name="phone"]',
          )
          ?.focus(),
      );
      return;
    }

    startTransition(async () => {
      setVerifying(!token.current && Boolean(turnstileSiteKey));
      const turnstileToken = await waitForToken();
      setVerifying(false);
      const outcome = await submitQuoteLead({
        estimate: request,
        name,
        phone,
        website: field("website"),
        turnstileToken: turnstileToken ?? undefined,
        utm: readUtm(),
        sourcePath: window.location.pathname + window.location.search,
        referrer: document.referrer || undefined,
        locale,
      }).catch((): LeadResult => ({ ok: false, reason: "unavailable" }));
      if (outcome.ok) setSubmittedPhone(formatIndianMobile(phone) ?? phone);
      setResult(outcome);
    });
  }

  if (result?.ok) {
    return (
      <div
        role="status"
        className="grid gap-4 rounded-xl bg-success-soft p-5 text-success-soft-foreground"
      >
        <p className="flex items-center gap-2 text-xl font-bold">
          <CheckCircle2 aria-hidden="true" className="size-6" />
          {labels.lead.successTitle}
        </p>
        <p className="text-base">
          {callbackMinutes
            ? fill(labels.lead.successBody, {
                reference: result.reference,
                phone: submittedPhone,
                minutes: callbackMinutes,
              })
            : fill(labels.lead.successBodyNoSla, {
                reference: result.reference,
                phone: submittedPhone,
              })}
        </p>
        <div className="flex flex-wrap gap-3">
          {whatsappHref ? (
            <Button asChild variant="secondary">
              <a href={whatsappHref} target="_blank" rel="noopener">
                <MessageCircle aria-hidden="true" /> {labels.lead.whatsapp}
              </a>
            </Button>
          ) : null}
          <Button variant="ghost" onClick={onReset}>
            {labels.lead.another}
          </Button>
        </div>
      </div>
    );
  }

  const fieldErrors = result && !result.ok ? result.fieldErrors : undefined;
  const formError =
    result && !result.ok && !fieldErrors?.name && !fieldErrors?.phone
      ? labels.errors[result.reason]
      : null;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4" aria-busy={pending || undefined}>
      <Field label={labels.lead.name} error={fieldErrors?.name}>
        {(control) => (
          <Input
            {...control}
            name="name"
            autoComplete="name"
            enterKeyHint="next"
            required
            minLength={2}
          />
        )}
      </Field>
      <Field label={labels.lead.phone} error={fieldErrors?.phone}>
        {(control) => <PhoneInput {...control} name="phone" enterKeyHint="send" required />}
      </Field>

      {/* Honeypot: hidden from people and assistive tech, irresistible to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {turnstileSiteKey ? (
        <Turnstile siteKey={turnstileSiteKey} onToken={onToken} action="quote_lead" />
      ) : null}

      {formError ? (
        <p role="alert" className="font-medium text-danger">
          {formError}
        </p>
      ) : null}

      <Button type="submit" variant="cta" size="lg" block loading={pending}>
        {callbackMinutes
          ? fill(labels.lead.submit, { minutes: callbackMinutes })
          : labels.lead.submitNoSla}
      </Button>
      {verifying ? (
        <p role="status" className="text-sm text-muted-foreground">
          {labels.lead.verifying}
        </p>
      ) : null}
      {whatsappHref ? (
        <Button asChild variant="secondary" size="lg" block>
          <a href={whatsappHref} target="_blank" rel="noopener">
            <MessageCircle aria-hidden="true" /> {labels.lead.whatsapp}
          </a>
        </Button>
      ) : null}
      <p className="text-sm text-muted-foreground">
        {labels.lead.consent}{" "}
        <Link href={labels.privacyHref} className="text-link underline underline-offset-2">
          {labels.lead.privacyLink}
        </Link>
        .
      </p>
    </form>
  );
}
