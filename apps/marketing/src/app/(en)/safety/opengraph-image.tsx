import { getContent } from "@/content";
import { ogSize, pageOgImage } from "@/lib/og";

const c = getContent();

export const alt = `${c.safety.meta.title} | ${c.site.name}`;
export const size = ogSize;
export const contentType = "image/png";

/** Share image for /safety. */
export default function OpenGraphImage() {
  return pageOgImage({ title: c.safety.meta.title, eyebrow: c.safety.hero.eyebrow, truck: "lcv" });
}
