import { illustrationKindFor } from "@truckbuck/ui/truck-illustration";

import { getContent } from "@/content";
import { ogSize, pageOgImage } from "@/lib/og";
import { getCatalog } from "@/server/catalog";

const c = getContent();

export const size = ogSize;
export const contentType = "image/png";

export async function generateImageMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { trucks } = await getCatalog();
  const truck = trucks.find((t) => t.slug === slug);
  return [
    {
      id: "og",
      alt: truck ? `${truck.name} | ${c.site.name}` : c.site.name,
      size: ogSize,
      contentType: "image/png",
    },
  ];
}

/** Share image for one truck page: its name and class illustration. */
export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { trucks } = await getCatalog();
  const truck = trucks.find((t) => t.slug === slug);
  if (!truck) return pageOgImage({ title: c.trucksPage.meta.title, eyebrow: c.site.name });
  return pageOgImage({
    title: truck.name,
    eyebrow: c.trucksPage.meta.title,
    truck: illustrationKindFor(truck.iconKey),
  });
}
