import type { Content } from "@/content";

/** The slice of copy the widget needs, passed from the server as props (keeps en.ts out of the client bundle). */
export interface WidgetLabels {
  widget: Content["home"]["widget"];
  result: Content["home"]["result"];
  lead: Content["home"]["lead"];
  errors: Content["home"]["errors"];
  whatsapp: Content["whatsapp"];
  privacyHref: string;
}

export interface WidgetTruck {
  slug: string;
  name: string;
  iconKey: string;
  lengthFt: number;
  payloadTonnes: number;
}

export interface WidgetConfig {
  trucks: WidgetTruck[];
  whatsappNumber: string | null;
  turnstileSiteKey: string | null;
  mapsEmbedKey: string | null;
  callbackMinutes: number | null;
  /** Language the lead came from. */
  locale: "en" | "hi" | "ta";
}
