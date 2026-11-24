import { getContent } from "@/content";
import { ogSize, pageOgImage } from "@/lib/og";

const c = getContent();

export const alt = `${c.grievance.title} | ${c.site.name}`;
export const size = ogSize;
export const contentType = "image/png";

/** Share image for /grievance. */
export default function OpenGraphImage() {
  return pageOgImage({ title: c.grievance.title, eyebrow: c.site.name });
}
