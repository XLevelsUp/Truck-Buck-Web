import { getContent } from "@/content";
import { company } from "@/content/company";
import { env } from "@/env";
import type { Locale } from "@/i18n/locales";
import { routes } from "@/lib/routes";
import type { TruckType } from "@/server/catalog-types";

import type { WidgetConfig, WidgetLabels } from "./labels";

/** Labels + config for <EstimateWidget>, shared by every page that embeds it. */
export function widgetProps(
  trucks: TruckType[],
  locale: Locale = "en",
): { labels: WidgetLabels; config: WidgetConfig } {
  const content = getContent(locale);
  return {
    labels: {
      widget: content.home.widget,
      result: content.home.result,
      lead: content.home.lead,
      errors: content.home.errors,
      whatsapp: content.whatsapp,
      privacyHref: routes.privacy.path,
    },
    config: {
      trucks: trucks.map(({ slug, name, iconKey, lengthFt, payloadTonnes }) => ({
        slug,
        name,
        iconKey,
        lengthFt,
        payloadTonnes,
      })),
      whatsappNumber: env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? null,
      turnstileSiteKey: env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null,
      mapsEmbedKey: env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY ?? null,
      callbackMinutes: company.callbackMinutes,
      locale,
    },
  };
}
