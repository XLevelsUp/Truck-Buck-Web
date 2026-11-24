"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";

import { Button } from "@truckbuck/ui/button";
import { cn } from "@truckbuck/ui/lib/utils";

export interface BottomBarAction {
  href: string;
  label: string;
  /** Section the action scrolls to: the bar hides while it is on screen. */
  targetId: string;
}

interface BottomBarProps {
  /** Default action (Get price). */
  primary: BottomBarAction;
  /** Per-page override, matched on the path without locale prefix (DECISION-2). */
  overrides: Record<string, BottomBarAction>;
  whatsappHref: string | null;
  whatsappLabel: string;
  /** Landmark name (i18n), e.g. "Quick actions". */
  label: string;
}

const stripLocale = (path: string) => path.replace(/^\/(hi|ta)(?=\/)/, "");

/**
 * Sticky bar under 768px: the page's main action + WhatsApp. /transporters
 * shows "Apply to join", /drivers "Get the app", everything else "Get price".
 * Hidden while that action's own section is on screen (no duplicate CTA) and
 * while a text field has focus (keyboard open). Fixed-position: no layout shift.
 */
export function BottomBar({
  primary,
  overrides,
  whatsappHref,
  whatsappLabel,
  label,
}: BottomBarProps) {
  const pathname = usePathname();
  const action = overrides[stripLocale(pathname)] ?? primary;
  const [targetVisible, setTargetVisible] = useState(false);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const target = document.getElementById(action.targetId);
    const observer = target
      ? new IntersectionObserver(([entry]) => setTargetVisible(entry?.isIntersecting ?? false), {
          threshold: 0.1,
        })
      : null;
    if (target) observer?.observe(target);
    return () => observer?.disconnect();
  }, [action.targetId, pathname]);

  useEffect(() => {
    const isField = (target: EventTarget | null) =>
      target instanceof HTMLElement && target.matches("input, textarea, select");
    const onFocusIn = (event: FocusEvent) => setTyping(isField(event.target));
    const onFocusOut = (event: FocusEvent) => setTyping(isField(event.relatedTarget));
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  const hidden = targetVisible || typing;
  const external = /^https?:/.test(action.href);

  return (
    <nav
      aria-label={label}
      className={cn(
        "fixed inset-x-0 bottom-0 z-bottom-bar border-t bg-surface px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-transform duration-base ease-standard md:hidden",
        hidden && "translate-y-full",
      )}
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
    >
      <div className={cn("grid gap-2", whatsappHref ? "grid-cols-2" : "grid-cols-1")}>
        <Button asChild variant="cta" block>
          {external ? (
            <a href={action.href} target="_blank" rel="noopener">
              {action.label}
            </a>
          ) : (
            <Link href={action.href}>{action.label}</Link>
          )}
        </Button>
        {whatsappHref ? (
          <Button asChild variant="secondary" block>
            <a href={whatsappHref} target="_blank" rel="noopener">
              <MessageCircle aria-hidden="true" /> {whatsappLabel}
            </a>
          </Button>
        ) : null}
      </div>
    </nav>
  );
}
