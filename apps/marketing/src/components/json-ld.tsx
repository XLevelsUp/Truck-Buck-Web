import { getContent } from "@/content";
import { env } from "@/env";

/** schema.org Organization — helps search engines show the brand panel. */
export function OrganizationJsonLd() {
  const { site } = getContent();
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: env.NEXT_PUBLIC_SITE_URL,
    logo: `${env.NEXT_PUBLIC_SITE_URL}/logo.svg`,
    description: site.description,
    areaServed: { "@type": "Country", name: "India" },
    sameAs: [env.NEXT_PUBLIC_PLAY_STORE_URL],
  };

  return (
    <script
      type="application/ld+json"
      // Escape `<` so a value can never close the script tag (XSS guard).
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
