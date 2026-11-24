import { getContent } from "@/content";
import { ogSize, pageOgImage } from "@/lib/og";

const c = getContent();

export const alt = `${c.pricing.meta.title} | ${c.site.name}`;
export const size = ogSize;
export const contentType = "image/png";

/** Share image for /pricing: the brand template with this page's title. */
export default function OpenGraphImage() {
  return pageOgImage({
    title: c.pricing.meta.title,
    eyebrow: c.pricing.hero.eyebrow,
    truck: "lcv",
  });
}
