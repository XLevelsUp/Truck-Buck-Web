/* eslint-disable @next/next/no-img-element -- client logos are small remote SVG/PNG files supplied by clients; next/image needs per-host config added once real logos exist. */
import { Accordion, AccordionItem } from "@truckbuck/ui/accordion";
import { LogoCloud } from "@truckbuck/ui/logo-cloud";
import { Testimonial } from "@truckbuck/ui/testimonial";

import { getContent } from "@/content";
import type { Locale } from "@/i18n/locales";
import type { ClientLogoRecord, Faq, TestimonialRecord } from "@/server/catalog-types";

import { Section, SectionHeading } from "./sections";

/** 9. Only renders when approved, consented data exists. */
export function SocialProof({
  testimonials,
  logos,
  locale = "en",
}: {
  testimonials: TestimonialRecord[];
  logos: ClientLogoRecord[];
  locale?: Locale;
}) {
  const s = getContent(locale).home.social;
  if (testimonials.length === 0 && logos.length === 0) return null;
  return (
    <Section labelledBy="social-title" tone="muted">
      <SectionHeading id="social-title" title={s.testimonialsTitle} />
      {testimonials.length > 0 ? (
        <ul className="grid gap-4 md:grid-cols-3">
          {testimonials.map((t) => (
            <li key={t.name + t.quote.slice(0, 20)}>
              <Testimonial
                quote={t.quote}
                name={t.name}
                {...(t.role ? { role: t.role } : {})}
                {...(t.company ? { company: t.company } : {})}
              />
            </li>
          ))}
        </ul>
      ) : null}
      <LogoCloud
        headingLevel={3}
        title={s.logosTitle}
        logos={logos.map((logo) => ({
          name: logo.name,
          logo: <img src={logo.logoUrl} alt="" loading="lazy" height={40} />,
        }))}
      />
    </Section>
  );
}

/** 10. FAQ with FAQPage structured data (answers are in the HTML: native <details>). */
export function HomeFaq({ faqs, locale = "en" }: { faqs: readonly Faq[]; locale?: Locale }) {
  const f = getContent(locale).home.faq;
  if (faqs.length === 0) return null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
  return (
    <Section labelledBy="faq-title" id="faq">
      <SectionHeading id="faq-title" title={f.title} />
      <Accordion className="max-w-3xl">
        {faqs.map((faq) => (
          <AccordionItem key={faq.question} name="home-faq" title={faq.question}>
            {faq.answer}
          </AccordionItem>
        ))}
      </Accordion>
      <script
        type="application/ld+json"
        // Escape `<` so content can never close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </Section>
  );
}
