import "server-only";

import { serverEnv } from "@/env.server";
import { log } from "@/server/log";

/** Escapes text for HTML email bodies. */
export const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Sends an email through Resend (https://resend.com/docs/api-reference/emails).
 * Skipped (logged) until RESEND_API_KEY + EMAIL_FROM are set. Never throws.
 */
export async function sendEmail(input: {
  to: readonly string[];
  subject: string;
  html: string;
  text: string;
  idempotencyKey?: string;
}): Promise<"sent" | "skipped" | "failed"> {
  const cfg = serverEnv.email;
  if (!cfg || input.to.length === 0) {
    // Never log the subject: it can contain a lead's name.
    log.warn(
      "[email] Resend or recipients not configured — email skipped:",
      input.idempotencyKey ?? "",
    );
    return "skipped";
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        "Content-Type": "application/json",
        ...(input.idempotencyKey ? { "Idempotency-Key": input.idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from: cfg.from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
      log.error("[email] Resend failed", response.status, await response.text());
      return "failed";
    }
    return "sent";
  } catch (error) {
    log.error("[email] Resend failed", error);
    return "failed";
  }
}
