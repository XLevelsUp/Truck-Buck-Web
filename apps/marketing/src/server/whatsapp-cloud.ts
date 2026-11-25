import "server-only";

import { serverEnv } from "@/env.server";
import { log } from "@/server/log";

/*
 * WhatsApp Business Cloud API (Meta) — approved template messages only, which
 * is what business-initiated messages require. Sending needs
 * WHATSAPP_CLOUD_TOKEN + WHATSAPP_PHONE_NUMBER_ID; each template is optional
 * and its message is skipped (and logged) until it is configured:
 *
 *   WHATSAPP_TRANSPORTER_TEMPLATE  {{1}} reference                       (transporter applicant)
 *   WHATSAPP_ACK_TEMPLATE          {{1}} reference, {{2}} callback window (customer)
 *   WHATSAPP_OPS_TEMPLATE          {{1}} type, {{2}} reference, {{3}} name, {{4}} phone, {{5}} summary (ops)
 */

export type WhatsappSendResult = "sent" | "skipped" | "failed";
export type TemplateKind = "transporter" | "ack" | "ops";

const GRAPH_VERSION = "v21.0";

/** Template language codes Meta uses for our locales. */
const templateLanguage = { en: "en", hi: "hi", ta: "ta" } as const;
export type WhatsappLocale = keyof typeof templateLanguage;

/** Meta rejects template params with newlines, tabs or 4+ spaces; keep them short. */
const param = (text: string) => text.replace(/\s+/g, " ").trim().slice(0, 300) || "-";

/** Sends one template message. Never throws: messaging must not fail a lead. */
export async function sendTemplate(
  kind: TemplateKind,
  toE164: string,
  params: readonly string[],
  locale: WhatsappLocale = "en",
): Promise<WhatsappSendResult> {
  const cfg = serverEnv.whatsappCloud;
  const template =
    kind === "transporter"
      ? cfg?.transporterTemplate
      : kind === "ack"
        ? cfg?.ackTemplate
        : cfg?.opsTemplate;
  if (!cfg || !template) {
    log.warn(`[whatsapp] ${kind} template not configured — message skipped`);
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
            name: template,
            language: { code: templateLanguage[locale] },
            components: [
              {
                type: "body",
                parameters: params.map((text) => ({ type: "text", text: param(text) })),
              },
            ],
          },
        }),
        signal: AbortSignal.timeout(8_000),
      },
    );
    if (!response.ok) {
      log.error(`[whatsapp] ${kind} send failed`, response.status, await response.text());
      return "failed";
    }
    return "sent";
  } catch (error) {
    log.error(`[whatsapp] ${kind} send failed`, error);
    return "failed";
  }
}

/** "Application received" to a transporter applicant. */
export function sendTransporterAck(
  toE164: string,
  reference: string,
  locale: WhatsappLocale,
): Promise<WhatsappSendResult> {
  return sendTemplate("transporter", toE164, [reference], locale);
}
