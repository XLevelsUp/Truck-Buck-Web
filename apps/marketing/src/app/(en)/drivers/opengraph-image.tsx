import { getContent } from "@/content";
import { ogSize, pageOgImage } from "@/lib/og";

const c = getContent();

export const alt = `${c.drivers.meta.title} | ${c.site.name}`;
export const size = ogSize;
export const contentType = "image/png";

/** Share image for /drivers: the brand template with this page's title. */
export default function OpenGraphImage() {
  return pageOgImage({
    title: c.drivers.meta.title,
    eyebrow: c.drivers.hero.eyebrow,
    truck: "lcv",
  });
}
