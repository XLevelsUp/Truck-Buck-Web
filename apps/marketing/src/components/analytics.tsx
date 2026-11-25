"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@truckbuck/ui/button";

import { captureAttribution } from "@/components/forms/attribution";
import { currentPage, initAnalytics, track } from "@/lib/analytics";
import { getConsent, onConsentChange, resetConsent, setConsent } from "@/lib/consent";

export interface AnalyticsLabels {
  label: string;
  body: string;
  accept: string;
  reject: string;
  privacy: string;
  settings: string;
}

/** Which part of the page a link sits in, for click events. */
function placementOf(el: Element): string {
  const explicit = el.closest<HTMLElement>("[data-track-placement]")?.dataset.trackPlacement;
  if (explicit) return explicit;
  if (el.closest("header")) return "header";
  if (el.closest("footer")) return "footer";
  if (el.closest("nav.fixed, [data-bottom-bar]")) return "bottom_bar";
  if (el.closest("dialog")) return "dialog";
  return "content";
}

/**
 * Site-wide analytics wiring (one per root layout):
 *   - first-touch attribution capture (for leads, not analytics);
 *   - GTM loaded only after consent; page_view on every route change;
 *   - delegated click tracking: WhatsApp, call, app badge, language switch;
 *   - the consent banner (bottom, non-modal) and "Cookie settings" reopen.
 */
export function Analytics({
  gtmId,
  language,
  labels,
  privacyHref,
}: {
  gtmId: string | null;
  language: string;
  labels: AnalyticsLabels;
  privacyHref: string;
}) {
  const pathname = usePathname();
  const consent = useSyncExternalStore(
    (notify) => onConsentChange(() => notify()),
    () => getConsent() ?? "unset",
    () => "server",
  );
  const [reopened, setReopened] = useState(false);

  useEffect(() => {
    captureAttribution();
    return initAnalytics(gtmId);
  }, [gtmId]);

  useEffect(() => {
    track("page_view", { page_path: pathname, page_title: document.title, language });
  }, [pathname, language]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      const href = link.getAttribute("href") ?? "";
      const page = currentPage();
      const placement = placementOf(link);
      if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)) {
        track("whatsapp_clicked", { page, placement });
      } else if (href.startsWith("tel:")) {
        track("call_clicked", { page, placement });
      } else if (href.includes("play.google.com")) {
        track("app_badge_clicked", { page, store: "google_play" });
      } else if (link.hreflang && link.closest("nav")) {
        const from = document.documentElement.lang;
        if (link.hreflang !== from) track("language_switched", { from, to: link.hreflang });
      }
    };
    const onReopen = () => {
      resetConsent();
      setReopened(true);
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("tb:consent-settings", onReopen);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("tb:consent-settings", onReopen);
    };
  }, []);

  // Nothing to ask without a tag manager; never shown during prerender.
  const show = gtmId !== null && consent === "unset";
  if (!show) return null;

  return (
    <section
      aria-label={labels.label}
      data-testid="consent-banner"
      className="fixed inset-x-0 bottom-0 z-overlay border-t bg-surface px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg md:inset-x-auto md:right-4 md:bottom-4 md:max-w-md md:rounded-xl md:border"
    >
      <p className="text-sm">
        {labels.body}{" "}
        <Link href={privacyHref} className="text-link underline underline-offset-2 focus-ring">
          {labels.privacy}
        </Link>
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          onClick={() => setConsent("denied")}
          // Focus lands here when reopened from "Cookie settings".
          autoFocus={reopened}
        >
          {labels.reject}
        </Button>
        <Button variant="cta" onClick={() => setConsent("granted")}>
          {labels.accept}
        </Button>
      </div>
    </section>
  );
}

/** Footer button that reopens the consent banner. */
export function CookieSettingsButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("tb:consent-settings"))}
      className="inline-flex min-h-6 items-center rounded-sm text-left underline-offset-4 focus-ring hover:underline"
    >
      {label}
    </button>
  );
}
