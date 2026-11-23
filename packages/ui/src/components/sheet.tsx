"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { Dialog as SheetPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "../lib/utils";

/**
 * Bottom sheet (mobile pickers, filters, "Which truck?" explainer) or side
 * drawer (mobile navigation). Same focus trap, Escape and focus-return
 * behaviour as Dialog — it is a Radix Dialog underneath.
 */
export const Sheet = SheetPrimitive.Root;
export const SheetTrigger = SheetPrimitive.Trigger;
export const SheetClose = SheetPrimitive.Close;

export const sheetVariants = cva(
  "fixed z-modal flex flex-col gap-4 bg-surface text-surface-foreground shadow-xl outline-none",
  {
    variants: {
      side: {
        bottom:
          "inset-x-0 bottom-0 max-h-[90dvh] rounded-t-3xl border-t px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] data-[state=closed]:animate-sheet-down data-[state=open]:animate-sheet-up",
        right:
          "inset-y-0 right-0 h-dvh w-[min(22rem,88vw)] border-l p-5 data-[state=closed]:animate-fade-out data-[state=open]:animate-sheet-left",
      },
    },
    defaultVariants: { side: "bottom" },
  },
);

export interface SheetContentProps
  extends ComponentProps<typeof SheetPrimitive.Content>, VariantProps<typeof sheetVariants> {
  closeLabel?: string;
}

export function SheetContent({
  className,
  children,
  side,
  closeLabel = "Close",
  ...props
}: SheetContentProps) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-overlay bg-overlay data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(sheetVariants({ side }), className)}
        {...props}
      >
        {side !== "right" ? (
          <span aria-hidden="true" className="mx-auto h-1.5 w-10 shrink-0 rounded-full bg-border" />
        ) : null}
        <div className="flex-1 overflow-y-auto">{children}</div>
        <SheetPrimitive.Close
          aria-label={closeLabel}
          className="absolute top-3 right-3 grid size-11 cursor-pointer place-items-center rounded-full text-muted-foreground focus-ring hover:bg-surface-muted hover:text-foreground"
        >
          <X aria-hidden="true" className="size-5" />
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

export function SheetHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("grid gap-1.5 pr-12 pb-2", className)} {...props} />;
}

export function SheetTitle({ className, ...props }: ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title className={cn("text-xl leading-tight font-bold", className)} {...props} />
  );
}

export function SheetDescription({
  className,
  ...props
}: ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      className={cn("text-base text-muted-foreground", className)}
      {...props}
    />
  );
}
