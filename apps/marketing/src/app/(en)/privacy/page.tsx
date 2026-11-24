import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal-document";
import { getContent } from "@/content";
import { getLegalFacts } from "@/lib/legal-facts";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";

const { privacy } = getContent();

export const metadata: Metadata = pageMetadata({
  title: privacy.title,
  description: privacy.description,
  path: routes.privacy.path,
});

/** DRAFT legal text (NFC-19); company and policy facts come from getLegalFacts(). */
export default async function PrivacyPage() {
  const facts = await getLegalFacts();
  return (
    <LegalDocument
      title={privacy.title}
      lastUpdated={privacy.lastUpdated}
      intro={privacy.intro}
      sections={privacy.sections}
      facts={facts}
    />
  );
}
