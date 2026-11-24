import { getContent } from "@/content";
import { ogSize, pageOgImage } from "@/lib/og";

export const alt = getContent().site.tagline;
export const size = ogSize;
export const contentType = "image/png";

/**
 * Share image for /hi and /ta pages. English for now: the OG renderer's font
 * has no Devanagari or Tamil glyphs (see src/lib/og.tsx).
 */
export default function OpenGraphImage() {
  const { site } = getContent();
  return pageOgImage({ title: site.tagline, eyebrow: site.name, truck: "lcv" });
}
