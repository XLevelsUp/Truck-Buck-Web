import { getContent } from "@/content";
import { ogSize, pageOgImage } from "@/lib/og";

const c = getContent();

export const alt = `${c.shippers.meta.title} | ${c.site.name}`;
export const size = ogSize;
export const contentType = "image/png";

/** Share image for /shippers: the brand template with this page's title. */
export default function OpenGraphImage() {
  return pageOgImage({
    title: c.shippers.meta.title,
    eyebrow: c.shippers.hero.eyebrow,
    truck: "mcv",
  });
}
