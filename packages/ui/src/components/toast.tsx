"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { Toast as ToastPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "../lib/utils";

/*
 * Low-level toast primitives (Radix Toast). Most code should use <Toaster />
 * and `useToast()` from "@truckbuck/ui/toaster" instead of these directly.
 */

export const ToastProvider = ToastPrimitive.Provider;

export function ToastViewport({
  className,
  ...props
}: ComponentProps<typeof ToastPrimitive.Viewport>) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={cn(
        "fixed right-0 bottom-0 z-toast flex max-h-dvh w-full flex-col gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] outline-none md:max-w-sm",
        className,
      )}
      {...props}
    />
  );
}

export const toastVariants = cva(
  "pointer-events-auto relative flex w-full items-start justify-between gap-3 rounded-xl border border-l-4 bg-surface p-4 pr-12 text-surface-foreground shadow-lg data-[state=closed]:animate-fade-out data-[state=open]:animate-slide-in data-[swipe=end]:animate-fade-out data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
  {
    variants: {
      variant: {
        default: "border-l-primary",
        success: "border-l-success",
        info: "border-l-info",
        danger: "border-l-danger",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface ToastProps
  extends ComponentProps<typeof ToastPrimitive.Root>, VariantProps<typeof toastVariants> {}

export function Toast({ className, variant, ...props }: ToastProps) {
  return (
    <ToastPrimitive.Root
      data-slot="toast"
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  );
}

export function ToastTitle({ className, ...props }: ComponentProps<typeof ToastPrimitive.Title>) {
  return (
    <ToastPrimitive.Title
      data-slot="toast-title"
      className={cn("text-base font-semibold", className)}
      {...props}
    />
  );
}

export function ToastDescription({
  className,
  ...props
}: ComponentProps<typeof ToastPrimitive.Description>) {
  return (
    <ToastPrimitive.Description
      data-slot="toast-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export function ToastAction({ className, ...props }: ComponentProps<typeof ToastPrimitive.Action>) {
  return (
    <ToastPrimitive.Action
      data-slot="toast-action"
      className={cn(
        "inline-flex min-h-9 shrink-0 cursor-pointer items-center rounded-lg border border-border-strong px-3 text-sm font-semibold focus-ring hover:bg-surface-muted",
        className,
      )}
      {...props}
    />
  );
}

export function ToastClose({
  className,
  "aria-label": ariaLabel = "Close",
  ...props
}: ComponentProps<typeof ToastPrimitive.Close>) {
  return (
    <ToastPrimitive.Close
      data-slot="toast-close"
      aria-label={ariaLabel}
      className={cn(
        "absolute top-2 right-2 grid size-9 cursor-pointer place-items-center rounded-full text-muted-foreground focus-ring hover:bg-surface-muted hover:text-foreground",
        className,
      )}
      {...props}
    >
      <X aria-hidden="true" className="size-4" />
    </ToastPrimitive.Close>
  );
}
