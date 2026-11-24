"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { Button } from "@truckbuck/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@truckbuck/ui/sheet";

import type { Locale } from "@/i18n/locales";

import { LanguageSwitcher } from "./language-switcher";

export interface MobileNavProps {
  links: { href: string; label: string }[];
  labels: {
    open: string;
    close: string;
    title: string;
    description: string;
    getPrice: string;
    whatsapp: string;
  };
  getPriceHref: string;
  whatsappHref: string | null;
  language: { current: Locale; available: Locale[]; label: string };
}

/**
 * The drawer itself (Radix Dialog: focus trap, Escape, focus returns to the
 * menu button). Loaded on first tap by MobileNav, so its code is not part of
 * the initial page JavaScript.
 */
export default function MobileNavSheet({
  links,
  labels,
  getPriceHref,
  whatsappHref,
  language,
  open,
  onOpenChange,
  returnFocus,
}: MobileNavProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The menu button lives outside this lazily loaded dialog, so focus is returned explicitly. */
  returnFocus: () => void;
}) {
  const close = () => onOpenChange(false);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        closeLabel={labels.close}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocus();
        }}
      >
        <SheetHeader>
          <SheetTitle>{labels.title}</SheetTitle>
          <SheetDescription className="sr-only">{labels.description}</SheetDescription>
        </SheetHeader>
        <nav aria-label={labels.title}>
          <ul className="grid gap-1">
            {links.map((link) => (
              <li key={link.href + link.label}>
                <Link
                  href={link.href}
                  onClick={close}
                  className="flex min-h-12 items-center rounded-lg px-3 text-lg font-semibold focus-ring hover:bg-surface-muted"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-6 grid gap-3 border-t pt-6">
          <Button asChild variant="cta" block>
            <Link href={getPriceHref} onClick={close}>
              {labels.getPrice}
            </Link>
          </Button>
          {whatsappHref ? (
            <Button asChild variant="secondary" block>
              <a href={whatsappHref} target="_blank" rel="noopener">
                <MessageCircle aria-hidden="true" /> {labels.whatsapp}
              </a>
            </Button>
          ) : null}
          <LanguageSwitcher
            current={language.current}
            available={language.available}
            label={language.label}
            className="pt-2"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
