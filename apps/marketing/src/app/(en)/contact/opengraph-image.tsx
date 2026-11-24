import { getContent } from "@/content";
import { ogSize, pageOgImage } from "@/lib/og";

const c = getContent();

export const alt = `${c.contact.meta.title} | ${c.site.name}`;
export const size = ogSize;
export const contentType = "image/png";

/** Share image for /contact. */
export default function OpenGraphImage() {
  return pageOgImage({ title: c.contact.meta.title, eyebrow: c.site.name });
}
