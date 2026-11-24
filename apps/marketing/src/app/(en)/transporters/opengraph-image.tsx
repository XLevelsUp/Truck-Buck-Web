import { getContent } from "@/content";
import { ogSize, pageOgImage } from "@/lib/og";

const c = getContent();

export const alt = `${c.transporters.meta.title} | ${c.site.name}`;
export const size = ogSize;
export const contentType = "image/png";

/** Share image for /transporters: the brand template with this page's title. */
export default function OpenGraphImage() {
  return pageOgImage({
    title: c.transporters.meta.title,
    eyebrow: c.transporters.hero.eyebrow,
    truck: "open",
  });
}
