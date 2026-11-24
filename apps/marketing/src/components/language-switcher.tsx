"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Languages } from "lucide-react";

import { cn } from "@truckbuck/ui/lib/utils";

import {
  htmlLang,
  isLocalizedPath,
  type Locale,
  LOCALE_COOKIE,
  localeNames,
  localizedHref,
} from "@/i18n/locales";

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Stores the visitor's choice for proxy.ts. */
function remember(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
}

/** Path without a /hi or /ta prefix. */
function basePath(pathname: string): `/${string}` {
  const stripped = pathname.replace(/^\/(hi|ta)(?=\/|$)/, "");
  return (stripped || "/") as `/${string}`;
}

/**
 * Links to this page in each published language (or to that language's home
 * page when this page isn't translated yet). Clicking stores the choice in a
 * cookie, which proxy.ts uses to send returning visitors to their language.
 */
export function LanguageSwitcher({
  current,
  available,
  label,
  compact = false,
  className,
}: {
  current: Locale;
  /** Published locales only (unreviewed translations are filtered out on the server). */
  available: Locale[];
  label: string;
  /** One button that opens the list (header); otherwise every language as a pill. */
  compact?: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  const detailsRef = useRef<HTMLDetailsElement>(null);

  // Compact menu: close on outside click or Escape.
  useEffect(() => {
    if (!compact) return;
    const close = (event: Event) => {
      const details = detailsRef.current;
      if (!details?.open) return;
      if (event instanceof KeyboardEvent) {
        if (event.key !== "Escape") return;
        details.open = false;
        details.querySelector("summary")?.focus();
        return;
      }
      if (!details.contains(event.target as Node)) details.open = false;
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [compact]);

  if (available.length < 2) return null;
  const base = basePath(pathname);
  if (compact) {
    return (
      <nav aria-label={label} className={cn("relative text-sm", className)}>
        <details ref={detailsRef} className="group">
          <summary className="inline-flex min-h-9 cursor-pointer list-none items-center gap-1.5 rounded-full border px-3 font-semibold whitespace-nowrap focus-ring hover:bg-surface-muted [&::-webkit-details-marker]:hidden">
            <Languages aria-hidden="true" className="size-4 text-muted-foreground" />
            <span lang={htmlLang[current]}>{localeNames[current]}</span>
            <ChevronDown
              aria-hidden="true"
              className="size-4 text-muted-foreground group-open:rotate-180"
            />
          </summary>
          <ul className="absolute top-full right-0 z-popover mt-2 grid min-w-40 gap-1 rounded-xl border bg-surface p-1.5 shadow-lg">
            {available.map((locale) => (
              <li key={locale}>
                <Link
                  href={localizedHref(locale, isLocalizedPath(base) ? base : "/")}
                  hrefLang={htmlLang[locale]}
                  lang={htmlLang[locale]}
                  aria-current={locale === current ? "true" : undefined}
                  onClick={() => remember(locale)}
                  className="flex min-h-10 items-center rounded-lg px-3 font-medium focus-ring hover:bg-surface-muted aria-[current=true]:bg-primary-soft aria-[current=true]:font-bold aria-[current=true]:text-primary-soft-foreground"
                >
                  {localeNames[locale]}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      </nav>
    );
  }

  return (
    <nav
      aria-label={label}
      className={cn("flex flex-wrap items-center gap-1.5 text-sm", className)}
    >
      <Languages aria-hidden="true" className="size-4 text-muted-foreground" />
      {available.map((locale) => (
        <Link
          key={locale}
          href={localizedHref(locale, isLocalizedPath(base) ? base : "/")}
          hrefLang={htmlLang[locale]}
          lang={htmlLang[locale]}
          aria-current={locale === current ? "true" : undefined}
          onClick={() => remember(locale)}
          className="inline-flex min-h-9 items-center rounded-full border px-3 font-semibold focus-ring hover:bg-surface-muted aria-[current=true]:border-primary aria-[current=true]:bg-primary aria-[current=true]:text-primary-foreground"
        >
          {localeNames[locale]}
        </Link>
      ))}
    </nav>
  );
}
