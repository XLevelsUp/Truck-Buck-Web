import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal-document";
import { getContent } from "@/content";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";

const { terms } = getContent();

export const metadata: Metadata = pageMetadata({
  title: terms.title,
  description: terms.description,
  path: routes.terms.path,
});

export default function TermsPage() {
  return (
    <LegalDocument title={terms.title} lastUpdated={terms.lastUpdated} sections={terms.sections} />
  );
}
