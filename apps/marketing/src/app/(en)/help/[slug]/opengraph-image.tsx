import { getContent } from "@/content";
import { findHelpFaq } from "@/content/help";
import { ogSize, pageOgImage } from "@/lib/og";

const c = getContent();

export const size = ogSize;
export const contentType = "image/png";

export async function generateImageMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const faq = findHelpFaq(slug);
  return [
    {
      id: "og",
      alt: faq ? `${faq.question} | ${c.site.name}` : c.help.meta.title,
      size: ogSize,
      contentType: "image/png",
    },
  ];
}

/** Share image for one help answer: the question on the brand template. */
export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const faq = findHelpFaq(slug);
  return pageOgImage({
    title: faq?.question ?? c.help.meta.title,
    eyebrow: faq ? c.help.categories[faq.category] : c.site.name,
  });
}
