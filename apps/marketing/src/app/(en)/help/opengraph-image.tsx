import { getContent } from "@/content";
import { ogSize, pageOgImage } from "@/lib/og";

const c = getContent();

export const alt = `${c.help.meta.title} | ${c.site.name}`;
export const size = ogSize;
export const contentType = "image/png";

/** Share image for /help. */
export default function OpenGraphImage() {
  return pageOgImage({ title: c.help.meta.title, eyebrow: c.site.name });
}
