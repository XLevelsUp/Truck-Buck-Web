import { type ReactNode, useId } from "react";

import { cn } from "../lib/utils";
import { Label } from "./label";

export interface FieldControlProps {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
  "aria-required"?: true;
}

export interface FieldProps {
  label: ReactNode;
  /** Help text shown under the label, e.g. "We'll call this number". */
  hint?: ReactNode;
  /** Error message. Sets aria-invalid on the control and is announced with it. */
  error?: ReactNode;
  /** Adds a visible "(optional)" marker — we mark optional fields, not required ones. */
  optional?: boolean;
  /** Text for the optional marker (i18n). Default "optional". */
  optionalLabel?: string;
  className?: string;
  /** Pass a fixed id when the control must be targeted (e.g. from an error summary). */
  id?: string;
  /** Render prop: spread the props onto the control so label, hint and error are wired up. */
  children: (control: FieldControlProps) => ReactNode;
}

/**
 * Label + control + hint + error, with ids wired for screen readers:
 *
 *   <Field label="Mobile number" error={errors.phone}>
 *     {(control) => <PhoneInput {...control} name="phone" />}
 *   </Field>
 */
export function Field({
  label,
  hint,
  error,
  optional = false,
  optionalLabel = "optional",
  className,
  id: idProp,
  children,
}: FieldProps) {
  const generated = useId();
  const id = idProp ?? `field-${generated}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div data-slot="field" className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {optional ? (
          <>
            {" "}
            <span className="font-normal text-muted-foreground">({optionalLabel})</span>
          </>
        ) : null}
      </Label>
      {hint ? (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {children({
        id,
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
        ...(error ? { "aria-invalid": true as const } : {}),
        ...(optional ? {} : { "aria-required": true as const }),
      })}
      {/* Live region always present (display: contents, so no layout box) so the
          error is announced as it appears, not only when focus reaches the field. */}
      <div aria-live="polite" aria-atomic="true" className="contents">
        {error ? (
          <p id={errorId} className="text-sm font-medium text-danger">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
