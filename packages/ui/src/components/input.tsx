import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "../lib/utils";

/** Shared by Input, Select trigger, Combobox, PhoneInput and DatePicker so every field looks alike. */
export const fieldControlVariants = cva(
  "w-full min-w-0 rounded-lg border border-border-strong bg-surface text-base text-surface-foreground transition-[border-color,box-shadow] duration-fast placeholder:text-muted-foreground focus-visible:border-ring focus-visible:shadow-[0_0_0_1px_var(--color-ring)] focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70 aria-invalid:border-danger aria-invalid:focus-visible:shadow-[0_0_0_1px_var(--color-danger)]",
  {
    variants: {
      size: {
        md: "h-11 px-3",
        lg: "h-13 px-4 text-lg",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export interface InputProps
  extends Omit<ComponentProps<"input">, "size">, VariantProps<typeof fieldControlVariants> {}

/** Text input. Always 16px+ so iOS doesn't zoom on focus. Pair with <Field> for label and errors. */
export function Input({ className, type = "text", size, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(fieldControlVariants({ size }), className)}
      {...props}
    />
  );
}
