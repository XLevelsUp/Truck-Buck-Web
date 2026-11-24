import { getContent } from "@/content";
import { ogSize, pageOgImage } from "@/lib/og";

const c = getContent();

export const alt = `${c.truckBooking.hub.title} | ${c.site.name}`;
export const size = ogSize;
export const contentType = "image/png";

/** Share image for /truck-booking. */
export default function OpenGraphImage() {
  return pageOgImage({ title: c.truckBooking.hub.title, eyebrow: c.site.name, truck: "container" });
}
