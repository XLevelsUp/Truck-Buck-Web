import { getContent } from "@/content";
import { company } from "@/content/company";
import { env } from "@/env";

/** Absolute URL for a site path. */
export const absoluteUrl = (path: string) =>
  `${env.NEXT_PUBLIC_SITE_URL}${path === "/" ? "" : path}`;

const ORG_ID = () => `${env.NEXT_PUBLIC_SITE_URL}/#organization`;

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbList(crumbs: readonly Crumb[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export function faqPage(faqs: readonly { question: string; answer: string }[]) {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

/** A truck-booking service in one or more cities (city and lane pages). */
export function service(input: {
  name: string;
  path: string;
  areas: readonly { name: string; state: string }[];
  lowPricePaise?: number | null;
  highPricePaise?: number | null;
}) {
  const hasPrice = input.lowPricePaise != null && input.highPricePaise != null;
  return {
    "@type": "Service",
    name: input.name,
    serviceType: "Full truckload freight transport",
    url: absoluteUrl(input.path),
    provider: { "@id": ORG_ID() },
    areaServed: input.areas.map((area) => ({
      "@type": "City",
      name: area.name,
      containedInPlace: { "@type": "State", name: area.state },
    })),
    ...(hasPrice
      ? {
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "INR",
            lowPrice: Math.round(input.lowPricePaise! / 100),
            highPrice: Math.round(input.highPricePaise! / 100),
          },
        }
      : {}),
  };
}

/**
 * Organization + WebSite (with SearchAction into /help) on every page, and
 * LocalBusiness once the registered address is known (NFC-4) — Google
 * rejects a LocalBusiness without an address, so it is left out until then.
 */
export function siteGraph() {
  const { site } = getContent();
  const base = env.NEXT_PUBLIC_SITE_URL;
  const sameAs = [env.NEXT_PUBLIC_PLAY_STORE_URL, ...company.social.map((s) => s.href)];
  const address = company.registeredAddress
    ? { "@type": "PostalAddress", streetAddress: company.registeredAddress, addressCountry: "IN" }
    : null;

  const organization = {
    "@type": "Organization",
    "@id": ORG_ID(),
    name: site.name,
    ...(company.legalName ? { legalName: company.legalName } : {}),
    url: base,
    logo: `${base}/brand/icon-512.png`,
    description: site.description,
    areaServed: { "@type": "Country", name: "India" },
    ...(company.supportPhone ? { telephone: company.supportPhone } : {}),
    ...(company.supportEmail ? { email: company.supportEmail } : {}),
    ...(address ? { address } : {}),
    sameAs,
  };

  const website = {
    "@type": "WebSite",
    "@id": `${base}/#website`,
    name: site.name,
    url: base,
    publisher: { "@id": ORG_ID() },
    inLanguage: "en-IN",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${base}/help?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  const localBusiness = address
    ? {
        "@type": "LocalBusiness",
        "@id": `${base}/#localbusiness`,
        name: company.legalName ?? site.name,
        url: base,
        image: `${base}/brand/icon-512.png`,
        address,
        ...(company.supportPhone ? { telephone: company.supportPhone } : {}),
        ...(company.officeGeo
          ? {
              geo: {
                "@type": "GeoCoordinates",
                latitude: company.officeGeo.lat,
                longitude: company.officeGeo.lng,
              },
            }
          : {}),
        parentOrganization: { "@id": ORG_ID() },
      }
    : null;

  return {
    "@context": "https://schema.org",
    "@graph": [organization, website, ...(localBusiness ? [localBusiness] : [])],
  };
}

/** Wraps nodes in a schema.org graph for <JsonLd data=…>. */
export const graph = (...nodes: object[]) => ({
  "@context": "https://schema.org",
  "@graph": nodes,
});
