import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal-document";
import { getContent } from "@/content";
import { getLegalFacts } from "@/lib/legal-facts";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";

const { refundPolicy } = getContent();

export const metadata: Metadata = pageMetadata({
  title: refundPolicy.title,
  description: refundPolicy.description,
  path: routes.refundPolicy.path,
});

/** DRAFT legal text (NFC-19); company and policy facts come from getLegalFacts(). */
export default async function RefundPolicyPage() {
  const facts = await getLegalFacts();
  return (
    <LegalDocument
      title={refundPolicy.title}
      lastUpdated={refundPolicy.lastUpdated}
      intro={refundPolicy.intro}
      sections={refundPolicy.sections}
      facts={facts}
    />
  );
}
