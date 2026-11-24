import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { HelpSearch } from "@/components/help/help-search";
import { StillNeedHelp } from "@/components/help/still-need-help";
import { PageHero } from "@/components/page/page-blocks";
import { Section } from "@/components/page/section";
import { getContent } from "@/content";
import { helpCategoriesWithAnswers, helpFaqs } from "@/content/help";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";

const content = getContent();
const h = content.help;

export const metadata: Metadata = pageMetadata({
  title: h.meta.title,
  description: h.meta.description,
  path: routes.help.path,
});

/**
 * /help — search plus every answer grouped by topic, each linking to its own
 * page. Topics with no confirmed answers yet (e.g. payments, cancellation)
 * stay hidden until they have one.
 */
export default function HelpPage() {
  const faqs = helpFaqs();
  const categories = helpCategoriesWithAnswers(faqs);
  return (
    <>
      <PageHero eyebrow={h.hero.eyebrow} title={h.hero.title} lead={h.hero.lead} />
      <Section labelledBy="help-search-title">
        <h2 id="help-search-title" className="sr-only">
          {h.searchLabel}
        </h2>
        <HelpSearch
          faqs={faqs.map((faq) => ({ ...faq, category: h.categories[faq.category] }))}
          labels={{
            search: h.searchLabel,
            placeholder: h.searchPlaceholder,
            results: h.resultsCount,
            resultsOne: h.resultsOne,
            noResults: h.noResults,
          }}
        >
          <div className="grid gap-10">
            <h2 id="browse-title" className="text-3xl font-extrabold">
              {h.browseTitle}
            </h2>
            <nav aria-labelledby="browse-title" className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <a
                  key={category}
                  href={`#${category}`}
                  className="inline-flex min-h-11 items-center rounded-full border px-4 font-semibold focus-ring hover:bg-surface-muted"
                >
                  {h.categories[category]}
                </a>
              ))}
            </nav>
            <div className="grid gap-10 md:grid-cols-2">
              {categories.map((category) => (
                <section
                  key={category}
                  id={category}
                  aria-labelledby={`${category}-title`}
                  className="grid scroll-mt-24 content-start gap-3"
                >
                  <h3 id={`${category}-title`} className="text-xl font-bold">
                    {h.categories[category]}
                  </h3>
                  <ul className="grid divide-y rounded-xl border bg-surface">
                    {faqs
                      .filter((faq) => faq.category === category)
                      .map((faq) => (
                        <li key={faq.slug}>
                          <Link
                            href={`/help/${faq.slug}`}
                            className="flex min-h-12 items-center justify-between gap-3 p-4 font-medium focus-ring hover:bg-surface-muted"
                          >
                            {faq.question}
                            <ChevronRight
                              aria-hidden="true"
                              className="size-5 shrink-0 text-muted-foreground"
                            />
                          </Link>
                        </li>
                      ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </HelpSearch>
        <StillNeedHelp />
      </Section>
    </>
  );
}
