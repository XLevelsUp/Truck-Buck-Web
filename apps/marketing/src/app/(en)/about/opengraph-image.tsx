import { getContent } from "@/content";
import { ogSize, pageOgImage } from "@/lib/og";

const c = getContent();

export const alt = `${c.about.meta.title} | ${c.site.name}`;
export const size = ogSize;
export const contentType = "image/png";

/** Share image for /about. */
export default function OpenGraphImage() {
  return pageOgImage({ title: c.about.meta.title, eyebrow: c.site.name, truck: "mcv" });
}
