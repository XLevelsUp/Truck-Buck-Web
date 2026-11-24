import { siteGraph } from "@/lib/jsonld";

/** Organization, WebSite (+ SearchAction) and, once known, LocalBusiness — on every page. */
export function OrganizationJsonLd() {
  return (
    <script
      type="application/ld+json"
      // Escape `<` so a value can never close the script tag (XSS guard).
      dangerouslySetInnerHTML={{ __html: JSON.stringify(siteGraph()).replace(/</g, "\\u003c") }}
    />
  );
}
