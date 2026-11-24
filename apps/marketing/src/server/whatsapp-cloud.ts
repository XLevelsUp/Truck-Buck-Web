import "server-only";

import { serverEnv } from "@/env.server";

/*
 * WhatsApp Business Cloud API (Meta) — template messages only, which is what
 * business-initiated messages require. Inactive until all three env vars are
 * set; until then sends are logged and reported as "skipped".
 *
 *   WHATSAPP_CLOUD_TOKEN          permanent system-user token
 *   WHATSAPP_PHONE_NUMBER_ID      the sending number's id
 *   WHATSAPP_TRANSPORTER_TEMPLATE approved template name, one body param: {{1}} = reference
 */

export type WhatsappSendResult = "sent" | "skipped" | "failed";

const GRAPH_VERSION = "v21.0";

function config() {
  const cfg = serverEnv.whatsappCloud;
  return cfg
    ? { token: cfg.token, phoneNumberId: cfg.phoneNumberId, template: cfg.transporterTemplate }
    : null;
}

/** Template language codes Meta uses for our locales. */
const templateLanguage = { en: "en", hi: "hi", ta: "ta" } as const;

/**
 * Sends the "application received" template to a transporter. Never throws:
 * a failed acknowledgement must not fail the application.
 */
export async function sendTransporterAck(
  toE164: string,
  reference: string,
  locale: keyof typeof templateLanguage,
): Promise<WhatsappSendResult> {
  const cfg = config();
  if (!cfg) {
    console.warn("[whatsapp] Cloud API not configured — acknowledgement skipped for", reference);
    return "skipped";
  }
  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${cfg.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: toE164.replace(/^\+/, ""),
          type: "template",
          template: {
            name: cfg.template,
            language: { code: templateLanguage[locale] },
            components: [{ type: "body", parameters: [{ type: "text", text: reference }] }],
          },
        }),
        signal: AbortSignal.timeout(8_000),
      },
    );
    if (!response.ok) {
      console.error("[whatsapp] send failed", response.status, await response.text());
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.error("[whatsapp] send failed", error);
    return "failed";
  }
}
