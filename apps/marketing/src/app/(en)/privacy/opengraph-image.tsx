import { getContent } from "@/content";
import { ogSize, pageOgImage } from "@/lib/og";

const c = getContent();

export const alt = c.privacy.title;
export const size = ogSize;
export const contentType = "image/png";

/** Share image for /privacy. */
export default function OpenGraphImage() {
  return pageOgImage({ title: c.privacy.title, eyebrow: c.site.name });
}
