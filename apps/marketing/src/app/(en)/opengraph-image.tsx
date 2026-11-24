import { getContent } from "@/content";
import { ogSize, pageOgImage } from "@/lib/og";

export const alt = getContent().site.tagline;
export const size = ogSize;
export const contentType = "image/png";

/** Default share image for English pages without their own (home, legal pages). */
export default function OpenGraphImage() {
  const { site } = getContent();
  return pageOgImage({ title: site.tagline, eyebrow: site.name, truck: "lcv" });
}
