"use client";

import {
  type ComponentProps,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { CheckCircle2, MessageCircle } from "lucide-react";

import { Button } from "@truckbuck/ui/button";
import { fieldControlVariants } from "@truckbuck/ui/input";
import { cn } from "@truckbuck/ui/lib/utils";

import type { TurnstileAction } from "@/lib/turnstile-actions";

import { Turnstile } from "./turnstile";

const TOKEN_WAIT_MS = 10_000;

/** Calls `onArm` the first time someone focuses or touches the surrounding form. */
function ArmOnFormUse({ onArm }: { onArm: () => void }) {
  const anchor = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const form = anchor.current?.closest("form");
    if (!form) return;
    form.addEventListener("focusin", onArm, { once: true });
    form.addEventListener("pointerdown", onArm, { once: true });
    return () => {
      form.removeEventListener("focusin", onArm);
      form.removeEventListener("pointerdown", onArm);
    };
  }, [onArm]);
  return <span ref={anchor} hidden />;
}

/**
 * Turnstile token for a form. Cloudflare's script loads only once someone
 * starts using the form (never on page load: it is third-party JS on the
 * critical path otherwise); submit waits briefly for a token if needed.
 */
export function useBotCheck(siteKey: string | null, action: TurnstileAction) {
  const [armed, setArmed] = useState(false);
  // Tokens are single-use: once one is handed to a submit, the widget is
  // re-rendered (new key) so a retry after an error gets a fresh token.
  const [generation, setGeneration] = useState(0);
  const token = useRef<string | null>(null);
  const waiters = useRef<((value: string | null) => void)[]>([]);
  const arm = useCallback(() => setArmed(true), []);

  const onToken = useCallback((value: string | null) => {
    token.current = value;
    if (value) {
      waiters.current.forEach((resolve) => resolve(value));
      waiters.current = [];
    }
  }, []);

  const getToken = useCallback(async (): Promise<string | undefined> => {
    if (!siteKey) return undefined;
    setArmed(true);
    const value =
      token.current ??
      (await new Promise<string | null>((resolve) => {
        waiters.current.push(resolve);
        window.setTimeout(() => resolve(token.current), TOKEN_WAIT_MS);
      }));
    if (value) {
      token.current = null;
      setGeneration((g) => g + 1);
    }
    return value ?? undefined;
  }, [siteKey]);

  const widget = siteKey ? (
    armed ? (
      <Turnstile key={generation} siteKey={siteKey} onToken={onToken} action={action} />
    ) : (
      <ArmOnFormUse onArm={arm} />
    )
  ) : null;
  return { widget, getToken };
}

export { markLeadSent } from "@/lib/lead-sent";

/** Hidden from people and assistive tech; bots fill it. */
export function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
      <label>
        Website
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

export function Consent({
  text,
  linkLabel,
  href,
}: {
  text: string;
  linkLabel: string;
  href: string;
}) {
  return (
    <p className="text-sm text-muted-foreground">
      {text}{" "}
      <Link href={href} className="text-link underline underline-offset-2">
        {linkLabel}
      </Link>
      .
    </p>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="font-medium text-danger">
      {children}
    </p>
  );
}

/** Confirmation panel shown in place of a form after a successful submit. */
export function SuccessPanel({
  title,
  children,
  actions,
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div
      role="status"
      className="grid gap-4 rounded-xl bg-success-soft p-5 text-success-soft-foreground"
    >
      <p className="flex items-center gap-2 text-xl font-bold">
        <CheckCircle2 aria-hidden="true" className="size-6 shrink-0" />
        {title}
      </p>
      <div className="grid gap-2">{children}</div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}

export function WhatsappButton({ href, label }: { href: string; label: string }) {
  return (
    <Button asChild variant="secondary">
      <a href={href} target="_blank" rel="noopener">
        <MessageCircle aria-hidden="true" /> {label}
      </a>
    </Button>
  );
}

/** Multi-line text field styled like Input. */
export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(fieldControlVariants(), "h-auto min-h-24 py-2.5 leading-6", className)}
      rows={3}
      {...props}
    />
  );
}

interface ChoiceOption {
  value: string;
  label: ReactNode;
}

/**
 * Chips backed by native radios (single) or checkboxes (multiple), left
 * uncontrolled: the browser owns the checked state and CSS (:has(:checked))
 * does the styling, so a tap made before hydration on a slow phone is kept.
 * Read values with FormData. 44px targets.
 */
export function ChoiceChips({
  legend,
  hint,
  error,
  name,
  options,
  multiple = false,
  defaultValue = [],
  onChange,
}: {
  legend: string;
  hint?: string;
  error?: string | undefined;
  name: string;
  options: readonly ChoiceOption[];
  multiple?: boolean;
  defaultValue?: readonly string[];
  onChange?: () => void;
}) {
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;
  return (
    <fieldset
      className="grid min-w-0 gap-2"
      aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
      aria-invalid={error ? true : undefined}
    >
      <legend className="mb-1 text-sm font-semibold">{legend}</legend>
      {hint ? (
        <p id={hintId} className="-mt-1 text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="relative flex min-h-11 cursor-pointer items-center rounded-full border border-border-strong bg-surface px-4 font-semibold transition-colors duration-fast hover:bg-surface-muted has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground has-focus-visible:shadow-[0_0_0_2px_var(--color-background),0_0_0_4px_var(--color-ring)]"
          >
            <input
              type={multiple ? "checkbox" : "radio"}
              name={name}
              value={option.value}
              defaultChecked={defaultValue.includes(option.value)}
              onChange={onChange}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
      {/* Live region always present (display: contents, so no layout box) so the
          error is announced as it appears, not only when focus reaches the field. */}
      <div aria-live="polite" aria-atomic="true" className="contents">
        {error ? (
          <p id={errorId} className="text-sm font-medium text-danger">
            {error}
          </p>
        ) : null}
      </div>
    </fieldset>
  );
}

/** Small state helper for field errors keyed by field name. */
export function useFieldErrors() {
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const clear = useCallback((field: string) => {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }, []);
  return { errors, setErrors, clear };
}
