import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal-document";
import { getContent } from "@/content";
import { getLegalFacts } from "@/lib/legal-facts";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";

const { terms } = getContent();

export const metadata: Metadata = pageMetadata({
  title: terms.title,
  description: terms.description,
  path: routes.terms.path,
});

/** DRAFT legal text (NFC-19); company and policy facts come from getLegalFacts(). */
export default async function TermsPage() {
  const facts = await getLegalFacts();
  return (
    <LegalDocument
      title={terms.title}
      lastUpdated={terms.lastUpdated}
      intro={terms.intro}
      sections={terms.sections}
      facts={facts}
    />
  );
}
