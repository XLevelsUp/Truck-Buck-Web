import { Apple, Play } from "lucide-react";

import { getContent } from "@/content";
import { env } from "@/env";
import type { Locale } from "@/i18n/locales";

/*
 * Store badges drawn from tokens. TODO(NFC-8): swap the Play button for
 * Google's official "Get it on Google Play" badge artwork (brand guidelines
 * require it) once the asset is added to /public.
 */
export function AppBadges({
  tone = "default",
  locale = "en",
}: {
  tone?: "default" | "brand";
  locale?: Locale;
}) {
  const { cta } = getContent(locale);
  const frame =
    tone === "brand"
      ? "border-surface-brand-foreground/40 text-surface-brand-foreground"
      : "border-border-strong text-foreground";
  return (
    <div className="flex flex-wrap gap-3">
      <a
        href={env.NEXT_PUBLIC_PLAY_STORE_URL}
        target="_blank"
        rel="noopener"
        className={`inline-flex min-h-12 items-center gap-3 rounded-lg border px-4 focus-ring hover:opacity-90 ${frame}`}
      >
        <Play aria-hidden="true" className="size-6" />
        <span className="grid text-left leading-tight">
          <span className="text-xs">{cta.playStoreSmall}</span>{" "}
          <span className="text-lg font-bold">{cta.playStoreLarge}</span>
        </span>
      </a>
      <p
        className={`inline-flex min-h-12 items-center gap-3 rounded-lg border border-dashed px-4 ${frame}`}
      >
        <Apple aria-hidden="true" className="size-6" />
        <span className="grid text-left leading-tight">
          <span className="text-xs">{cta.appStoreSoonSmall}</span>{" "}
          <span className="text-lg font-bold">{cta.appStoreSoon}</span>
        </span>
      </p>
    </div>
  );
}
