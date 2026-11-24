import "server-only";

import QRCode from "qrcode";

import { palette } from "@truckbuck/ui/tokens";

/**
 * QR code as an SVG string, generated at build time (no client JS). Always
 * dark-on-white, whatever the page theme, so phone cameras can read it.
 */
export async function qrSvg(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: palette.grey[900], light: palette.white },
  });
}
