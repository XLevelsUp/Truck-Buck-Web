import { getContent } from "@/content";
import { ogSize, pageOgImage } from "@/lib/og";

const c = getContent();

export const alt = c.terms.title;
export const size = ogSize;
export const contentType = "image/png";

/** Share image for /terms. */
export default function OpenGraphImage() {
  return pageOgImage({ title: c.terms.title, eyebrow: c.site.name });
}
