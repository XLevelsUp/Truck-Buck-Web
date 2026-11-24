import { type Content, getContent } from "./index";

export const helpCategories = [
  "booking",
  "pricing",
  "payments",
  "cancellation",
  "tracking",
  "transporters",
  "drivers",
  "account",
] as const;
export type HelpCategory = (typeof helpCategories)[number];

export interface HelpFaq {
  slug: string;
  category: HelpCategory;
  question: string;
  answer: string;
}

type PageFaqKey = keyof Content["pageFaqs"];

/**
 * Answers already published on other pages, reused by question so the help
 * hub and the page never disagree. A renamed question fails the build.
 */
const reused: { slug: string; category: HelpCategory; from: PageFaqKey; question: string }[] = [
  {
    slug: "what-is-full-truck-load",
    category: "booking",
    from: "home",
    question: "What is a full truck load (FTL)?",
  },
  {
    slug: "who-carries-my-goods",
    category: "booking",
    from: "home",
    question: "Who carries my goods?",
  },
  {
    slug: "what-happens-after-a-callback-request",
    category: "booking",
    from: "home",
    question: "What happens after I ask for a callback?",
  },
  {
    slug: "continue-on-whatsapp",
    category: "booking",
    from: "home",
    question: "Can I continue on WhatsApp instead?",
  },
  {
    slug: "which-cities-do-you-serve",
    category: "booking",
    from: "home",
    question: "Which cities do you serve?",
  },
  {
    slug: "how-do-i-pick-the-right-truck",
    category: "booking",
    from: "trucks",
    question: "How do I pick the right truck?",
  },
  {
    slug: "what-if-no-transporter-accepts",
    category: "booking",
    from: "howItWorks",
    question: "What happens if a transporter doesn't accept?",
  },
  {
    slug: "how-is-the-fare-calculated",
    category: "pricing",
    from: "home",
    question: "How is the fare calculated?",
  },
  {
    slug: "why-a-fare-range",
    category: "pricing",
    from: "home",
    question: "Why do I see a range, not one price?",
  },
  {
    slug: "is-the-estimate-the-final-price",
    category: "pricing",
    from: "pricing",
    question: "Is the estimate the final price?",
  },
  {
    slug: "are-tolls-included",
    category: "pricing",
    from: "pricing",
    question: "Are tolls included?",
  },
  {
    slug: "night-and-same-day-pickups",
    category: "pricing",
    from: "pricing",
    question: "Why do night and same-day pickups cost more?",
  },
  {
    slug: "how-long-does-applying-take",
    category: "transporters",
    from: "transporters",
    question: "How long does applying take?",
  },
  {
    slug: "do-i-upload-documents",
    category: "transporters",
    from: "transporters",
    question: "Do I have to upload documents on the website?",
  },
  {
    slug: "can-i-choose-my-routes",
    category: "transporters",
    from: "transporters",
    question: "Can I choose my routes?",
  },
  {
    slug: "do-i-have-to-bid",
    category: "transporters",
    from: "transporters",
    question: "Do I have to bid for loads?",
  },
  {
    slug: "is-the-driver-app-free",
    category: "drivers",
    from: "drivers",
    question: "Is the app free?",
  },
  {
    slug: "will-the-app-work-on-my-phone",
    category: "drivers",
    from: "drivers",
    question: "Will it work on my phone?",
  },
  {
    slug: "my-transporter-is-not-on-truckbuck",
    category: "drivers",
    from: "drivers",
    question: "My transporter isn't on TruckBuck. Can I still use it?",
  },
  {
    slug: "what-will-the-rewards-be",
    category: "drivers",
    from: "drivers",
    question: "What will the rewards be?",
  },
  {
    slug: "do-i-need-to-sign-up-for-a-price",
    category: "account",
    from: "home",
    question: "Do I need to sign up to see a price?",
  },
  {
    slug: "do-i-need-an-account-to-book",
    category: "account",
    from: "shippers",
    question: "Do I need an account to book?",
  },
  {
    slug: "why-do-you-ask-for-my-gstin",
    category: "account",
    from: "shippers",
    question: "Why do you ask for my GSTIN?",
  },
];

/** Every help answer, each with its own URL (/help/[slug]). English only for now. */
export function helpFaqs(): HelpFaq[] {
  const content = getContent();
  const fromPages = reused.map(({ slug, category, from, question }) => {
    const faq = content.pageFaqs[from].find((entry) => entry.question === question);
    if (!faq) throw new Error(`Help FAQ "${slug}": no "${question}" in pageFaqs.${from}`);
    return { slug, category, question: faq.question, answer: faq.answer };
  });
  const extra = content.help.extraFaqs.map((faq) => ({
    ...faq,
    category: faq.category as HelpCategory,
  }));
  const all = [...fromPages, ...extra];
  const slugs = new Set(all.map((faq) => faq.slug));
  if (slugs.size !== all.length) throw new Error("Help FAQ slugs must be unique");
  return all;
}

/** Categories with at least one answer; empty ones stay hidden until they have content. */
export function helpCategoriesWithAnswers(faqs = helpFaqs()): HelpCategory[] {
  return helpCategories.filter((category) => faqs.some((faq) => faq.category === category));
}

export function findHelpFaq(slug: string): HelpFaq | null {
  return helpFaqs().find((faq) => faq.slug === slug) ?? null;
}
