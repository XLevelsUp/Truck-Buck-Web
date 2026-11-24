import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StillNeedHelp } from "@/components/help/still-need-help";
import { JsonLd } from "@/components/page/page-blocks";
import { getContent } from "@/content";
import { findHelpFaq, helpFaqs } from "@/content/help";
import { env } from "@/env";
import { fill } from "@/lib/format";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";

/** Every answer is prerendered with its own URL (indexable on its own). */
export function generateStaticParams() {
  return helpFaqs().map((faq) => ({ slug: faq.slug }));
}

export async function generateMetadata({ params }: PageProps<"/help/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const faq = findHelpFaq(slug);
  if (!faq) return {};
  return pageMetadata({
    title: faq.question,
    description: faq.answer.length > 155 ? `${faq.answer.slice(0, 152)}…` : faq.answer,
    path: `/help/${faq.slug}`,
  });
}

export default async function HelpAnswerPage({ params }: PageProps<"/help/[slug]">) {
  const { slug } = await params;
  const faq = findHelpFaq(slug);
  if (!faq) notFound();

  const h = getContent().help;
  const category = h.categories[faq.category];
  const related = helpFaqs()
    .filter((other) => other.category === faq.category && other.slug !== faq.slug)
    .slice(0, 4);
  const base = env.NEXT_PUBLIC_SITE_URL;

  return (
    <article className="mx-auto grid max-w-(--container-prose) gap-8 page-gutter py-12 md:py-16">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: faq.question,
                  acceptedAnswer: { "@type": "Answer", text: faq.answer },
                },
              ],
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: h.meta.title, item: `${base}/help` },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: faq.question,
                  item: `${base}/help/${faq.slug}`,
                },
              ],
            },
          ],
        }}
      />
      <nav aria-label={h.allTopics}>
        <Link
          href={`${routes.help.path}#${faq.category}`}
          className="rounded-sm text-link underline underline-offset-4 focus-ring"
        >
          {h.allTopics}
        </Link>
        <span aria-hidden="true" className="px-2 text-muted-foreground">
          /
        </span>
        <span className="text-muted-foreground">{category}</span>
      </nav>
      <div className="grid gap-4">
        <h1 className="text-4xl font-extrabold text-balance">{faq.question}</h1>
        <p className="text-xl leading-8">{faq.answer}</p>
      </div>

      {related.length > 0 ? (
        <section aria-labelledby="related-title" className="grid gap-3">
          <h2 id="related-title" className="text-xl font-bold">
            {fill(h.moreIn, { category })}
          </h2>
          <ul className="grid gap-2">
            {related.map((other) => (
              <li key={other.slug}>
                <Link
                  href={`/help/${other.slug}`}
                  className="rounded-sm text-link underline underline-offset-4 focus-ring"
                >
                  {other.question}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <StillNeedHelp />
    </article>
  );
}
