import { getContent } from "@/content";
import { env } from "@/env";
import { ogImage, ogSize } from "@/lib/og";

export const alt = getContent().site.tagline;
export const size = ogSize;
export const contentType = "image/png";

/** Default social share image, generated at build time from the OG template. */
export default function OpenGraphImage() {
  const { site } = getContent();
  return ogImage({
    title: site.tagline,
    eyebrow: site.name,
    footer: new URL(env.NEXT_PUBLIC_SITE_URL).host,
  });
}
