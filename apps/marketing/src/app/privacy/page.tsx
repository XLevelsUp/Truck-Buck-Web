import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal-document";
import { getContent } from "@/content";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";

const { privacy } = getContent();

export const metadata: Metadata = pageMetadata({
  title: privacy.title,
  description: privacy.description,
  path: routes.privacy.path,
});

export default function PrivacyPage() {
  return (
    <LegalDocument
      title={privacy.title}
      lastUpdated={privacy.lastUpdated}
      sections={privacy.sections}
    />
  );
}
