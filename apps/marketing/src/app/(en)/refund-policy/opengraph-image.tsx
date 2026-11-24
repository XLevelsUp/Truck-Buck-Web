import { getContent } from "@/content";
import { ogSize, pageOgImage } from "@/lib/og";

const c = getContent();

export const alt = `${c.refundPolicy.title} | ${c.site.name}`;
export const size = ogSize;
export const contentType = "image/png";

/** Share image for /refund-policy. */
export default function OpenGraphImage() {
  return pageOgImage({ title: c.refundPolicy.title, eyebrow: c.site.name });
}
