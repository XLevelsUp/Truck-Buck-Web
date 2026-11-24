import { getContent } from "@/content";
import { ogSize, pageOgImage } from "@/lib/og";

const c = getContent();

export const alt = `${c.howItWorks.meta.title} | ${c.site.name}`;
export const size = ogSize;
export const contentType = "image/png";

/** Share image for /how-it-works: the brand template with this page's title. */
export default function OpenGraphImage() {
  return pageOgImage({
    title: c.howItWorks.meta.title,
    eyebrow: c.howItWorks.hero.eyebrow,
    truck: "mcv",
  });
}
