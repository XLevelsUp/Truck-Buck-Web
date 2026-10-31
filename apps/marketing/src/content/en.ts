/**
 * All user-facing copy for the site, in one dictionary.
 *
 * Pages never hard-code strings: they read from `getContent()`. When i18n is
 * added (next-intl), this file becomes `messages/en.json` and `getContent()`
 * becomes `getTranslations()` — page markup does not change.
 */
export const en = {
  site: {
    name: "TruckBuck",
    tagline: "Closed-network truck booking for India",
    description:
      "TruckBuck connects shippers with vetted transporters. Book trucks, track trips and settle payments in one closed, trusted network.",
  },
  nav: {
    home: "Home",
    privacy: "Privacy",
    terms: "Terms",
    skipToContent: "Skip to content",
  },
  home: {
    eyebrow: "Now onboarding transporters",
    title: "Book trusted trucks, without the haggling.",
    lead: "TruckBuck is a closed network: every transporter is vetted before they can accept a load. Shippers get reliable capacity, transporters get steady work, drivers get clear trips.",
    primaryCta: "Get the driver app",
    secondaryCta: "How it works",
    featuresTitle: "Built for every side of the trip",
    features: [
      {
        title: "Shippers",
        body: "Post a load, see the fare up front and get a vetted transporter assigned — no brokers in between.",
      },
      {
        title: "Transporters",
        body: "Accept bookings that fit your fleet, assign drivers and get paid on time with transparent per-trip fees.",
      },
      {
        title: "Drivers",
        body: "Trip details, pickup and drop locations and proof of delivery in the TruckBuck driver app.",
      },
    ],
    stepsTitle: "How it works",
    steps: [
      "Shipper books a truck type, route and pickup time.",
      "A vetted transporter accepts and assigns a driver and vehicle.",
      "The driver completes the trip; both sides see live status and settlement.",
    ],
  },
  legal: {
    lastUpdatedLabel: "Last updated",
    placeholderNotice:
      "Placeholder text. This page must be replaced with counsel-approved copy before launch.",
  },
  privacy: {
    title: "Privacy Policy",
    description: "How TruckBuck collects, uses and protects your personal data.",
    lastUpdated: "2026-10-31",
    sections: [
      {
        heading: "Who we are",
        body: "TruckBuck operates a closed-network truck booking platform for shippers, transporters and drivers in India.",
      },
      {
        heading: "What we collect",
        body: "Account details (name, phone number, business details), booking and trip records, and — for drivers using the app — location during active trips.",
      },
      {
        heading: "How we use it",
        body: "To operate bookings, verify transporters, settle payments, resolve disputes and meet legal obligations, including under the Digital Personal Data Protection Act, 2023.",
      },
      {
        heading: "Your rights",
        body: "You may request access, correction or erasure of your personal data by contacting us. We respond within the timelines required by law.",
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    description: "The terms that govern use of the TruckBuck platform.",
    lastUpdated: "2026-10-31",
    sections: [
      {
        heading: "Eligibility",
        body: "TruckBuck is a closed network. Access is granted to shippers and transporters approved by TruckBuck.",
      },
      {
        heading: "Bookings and fees",
        body: "Fares and per-trip platform fees are shown before a booking is confirmed. Fees are non-refundable once a trip starts, except as set out in our dispute process.",
      },
      {
        heading: "Disputes",
        body: "Raise disputes through the platform within 7 days of trip completion. TruckBuck will review evidence from both parties.",
      },
      {
        heading: "Governing law",
        body: "These terms are governed by the laws of India.",
      },
    ],
  },
  notFound: {
    title: "Page not found",
    body: "The page you are looking for does not exist or has moved.",
    cta: "Back to home",
  },
  footer: {
    rights: "All rights reserved.",
  },
} as const;

export type Content = typeof en;
