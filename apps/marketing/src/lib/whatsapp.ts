import { env } from "@/env";

/**
 * Click-to-chat link (wa.me) with a prefilled message, or null when no
 * WhatsApp number is configured — callers hide the button then.
 */
export function whatsappUrl(message: string): string | null {
  const number = env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
