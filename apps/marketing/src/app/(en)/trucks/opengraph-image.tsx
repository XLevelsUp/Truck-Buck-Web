import { getContent } from "@/content";
import { ogSize, pageOgImage } from "@/lib/og";

const c = getContent();

export const alt = `${c.trucksPage.meta.title} | ${c.site.name}`;
export const size = ogSize;
export const contentType = "image/png";

/** Share image for /trucks: the brand template with this page's title. */
export default function OpenGraphImage() {
  return pageOgImage({ title: c.trucksPage.meta.title, eyebrow: c.site.name, truck: "container" });
}
