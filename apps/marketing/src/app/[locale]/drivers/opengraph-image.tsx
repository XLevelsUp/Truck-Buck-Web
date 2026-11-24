import { getContent } from "@/content";
import { ogSize, pageOgImage } from "@/lib/og";

const c = getContent();

export const alt = c.site.tagline;
export const size = ogSize;
export const contentType = "image/png";

/** Share image for /hi/drivers and /ta/drivers (English card: see src/lib/og.tsx). */
export default function OpenGraphImage() {
  return pageOgImage({ title: c.site.tagline, eyebrow: c.site.name, truck: "lcv" });
}
