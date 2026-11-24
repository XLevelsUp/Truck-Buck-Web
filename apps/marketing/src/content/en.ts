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
    tagline: "Book a truck like you book a cab",
    description:
      "Book a full truck like you book a cab. Enter your route, pick a truck and see the fare range up front. Only vetted transporters can take your load.",
  },
  nav: {
    home: "Home",
    shippers: "Shippers",
    transporters: "Transporters",
    drivers: "Drivers",
    pricing: "Pricing",
    help: "Help",
    privacy: "Privacy",
    terms: "Terms",
    grievance: "Grievance redressal",
    refund: "Refunds and cancellation",
    safety: "Safety",
    about: "About us",
    contact: "Contact",
    skipToContent: "Skip to content",
    primary: "Main",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    menuTitle: "Menu",
    menuDescription: "Pages and ways to reach us",
    quickActions: "Quick actions",
  },
  cta: {
    getPrice: "Get a price",
    getPriceShort: "Get price",
    whatsapp: "WhatsApp",
    chatOnWhatsapp: "Chat on WhatsApp",
    playStore: "Get it on Google Play",
    playStoreSmall: "Get it on",
    playStoreLarge: "Google Play",
    appStoreSoon: "App Store",
    appStoreSoonSmall: "Coming soon to the",
  },
  whatsapp: {
    general: "Hi TruckBuck, I need a truck.",
    transporter: "Hi TruckBuck, I own trucks and want to join your network.",
    quoteIntro: "Hi TruckBuck, I'd like to book a truck.",
    route: "Route",
    truck: "Truck",
    date: "Pickup date",
    estimate: "Estimate",
    distance: "Distance",
    link: "Link",
  },
  home: {
    meta: {
      title: "Book a truck like you book a cab",
    },
    hero: {
      title: "Book a truck like you book a cab.",
      lead: "Enter your route, pick a truck, see the fare. A vetted transporter takes it from there.",
    },
    widget: {
      title: "Get an instant fare",
      pickup: "Pickup",
      pickupPlaceholder: "City, area or pincode",
      drop: "Drop",
      dropPlaceholder: "City, area or pincode",
      useMyLocation: "Use my location",
      locating: "Finding you…",
      locationDenied: "Location is off. Type your pickup instead.",
      truck: "Truck type",
      truckSpec: "{tonnes} t · {feet} ft",
      when: "When",
      today: "Today",
      tomorrow: "Tomorrow",
      more: "Add weight and material",
      optional: "optional",
      weight: "Weight in tonnes",
      material: "What are you sending?",
      materialPlaceholder: "e.g. cartons, steel, furniture",
      submit: "Get price",
      searching: "Searching…",
      noMatches: "No matches. Try a city or pincode.",
      suggestions: "Suggestions",
      results: "{count} results available",
      missingPickup: "Choose a pickup from the list.",
      missingDrop: "Choose a drop from the list.",
      missingTruck: "Choose a truck type.",
      samePlace: "Pickup and drop must be different places.",
    },
    result: {
      title: "Your estimate",
      range: "{min} – {max}",
      gstNote: "including {gst}% GST",
      distance: "Distance",
      distanceValue: "{km} km",
      transit: "Transit time",
      hours: "about {min}–{max} hours",
      days: "about {min}–{max} days",
      includes: "Included",
      excludes: "Not included",
      night: "Includes a night-pickup charge.",
      urgent: "Includes a same-day pickup charge.",
      sample: "Sample rates — for testing only",
      edit: "Change route",
      mapLabel: "Route from {from} to {to}",
      openMap: "Open interactive map",
      openInMaps: "Open in Google Maps",
      notServedTitle: "We don't serve this route yet",
      notServedBody: "Leave your number and we'll call you if we can help.",
      unpricedTitle: "We'll call you with a price",
      unpricedBody: "Leave your number and our team will confirm the fare for this route.",
    },
    lead: {
      name: "Your name",
      phone: "Mobile number",
      nameError: "Enter your name.",
      phoneError: "Enter a 10-digit mobile number, like 98765 43210.",
      submit: "Get a callback in {minutes} min",
      submitNoSla: "Request a callback",
      whatsapp: "Continue on WhatsApp",
      consent: "We'll use your number only to call you about this request. See our",
      privacyLink: "Privacy Policy",
      successTitle: "Request received",
      successBody: "Reference {reference}. We'll call {phone} within {minutes} minutes.",
      successBodyNoSla: "Reference {reference}. We'll call {phone} soon.",
      another: "Get another price",
      verifying: "Checking you're not a bot…",
    },
    errors: {
      place_not_found: "We couldn't find one of those places. Pick it again from the list.",
      no_route: "We couldn't find a road route between those places.",
      past_date: "Pick today or a later date.",
      invalid_truck: "Choose a truck type from the list.",
      unavailable: "We couldn't calculate this right now. Leave your number and we'll call you.",
      rate_limited: "Too many requests. Wait a minute and try again.",
      bot_check: "We couldn't confirm you're not a bot. Refresh the page and try again.",
      invalid: "Check the highlighted fields.",
      network: "You seem to be offline. Check your connection and try again.",
    },
    trust: {
      title: "Why shippers trust TruckBuck",
      vetted: "Only vetted transporters",
      gst: "GST-registered company",
      kyc: "KYC-verified drivers",
      pod: "Proof of delivery on every trip",
      support: "Support {hours}",
    },
    how: {
      eyebrow: "How it works",
      title: "Book a truck like a cab",
      lead: "Four steps from route to proof of delivery.",
      steps: [
        { title: "Enter your route", body: "Pickup, drop and the truck you need." },
        { title: "See your fare", body: "A fare range up front. No calling around." },
        { title: "Truck assigned", body: "A vetted transporter accepts and sends a truck." },
        { title: "Track and get POD", body: "Follow the trip and get proof of delivery." },
      ],
      screens: {
        route: { title: "New booking", from: "Pickup city", to: "Drop city", truck: "Truck type" },
        fare: { title: "Your fare", note: "Range shown before you book" },
        assigned: { title: "Truck assigned", note: "Vetted transporter" },
        track: { title: "Delivered", note: "Proof of delivery ready" },
      },
    },
    trucks: {
      title: "Trucks for every load",
      lead: "From mini trucks to large containers. Pick by size and payload.",
      payload: "Payload",
      length: "Length",
      tonnes: "{value} tonnes",
      feet: "{value} ft",
      cta: "See details",
      sample: "Sample",
      listLabel: "Truck types",
    },
    audiences: {
      title: "Built for every side of the trip",
      shippers: {
        title: "Shippers",
        body: "Manufacturers, distributors and traders. See the fare before you book and get a vetted transporter.",
        cta: "Get a price",
      },
      transporters: {
        title: "Transporters",
        body: "Own 1–10 trucks? Get loads at a known fare, without bidding against an open market.",
        cta: "Apply to join",
      },
      drivers: {
        title: "Drivers",
        body: "An app built for low-cost Android phones and weak signal, with updates on WhatsApp.",
        cta: "Get the driver app",
      },
    },
    compare: {
      title: "Calling a broker vs. TruckBuck",
      caption: "How booking through TruckBuck compares with booking through a broker",
      feature: "What you get",
      broker: "Broker call",
      truckbuck: "TruckBuck",
      rows: {
        price: {
          label: "Price",
          broker: "Negotiated call by call",
          truckbuck: "Fare range shown up front",
        },
        verification: {
          label: "Transporter checks",
          broker: "Varies",
          truckbuck: "Every transporter vetted",
        },
        tracking: {
          label: "Trip updates",
          broker: "Ask for updates",
          truckbuck: "Trip status updates",
        },
        pod: { label: "Proof of delivery", broker: "Ask for it", truckbuck: "POD on every trip" },
        invoice: { label: "Invoice", broker: "Varies", truckbuck: "GST invoice" },
      },
    },
    coverage: {
      title: "Where we run",
      lead: "Cities we pick up from and deliver to.",
      mapLabel: "Map of TruckBuck service cities and corridors",
      listTitle: "Cities served",
      sample: "Sample coverage for testing — not our real network yet",
      cta: "Don't see your city? Get a price anyway and we'll call you.",
    },
    social: {
      testimonialsTitle: "What shippers say",
      logosTitle: "Trusted by",
    },
    faq: {
      title: "Questions shippers ask",
    },
    final: {
      title: "Ready to move your load?",
      body: "Get a fare in under a minute. No sign-up.",
      appTitle: "Drive with TruckBuck?",
      appBody: "Get the driver app on Android.",
    },
  },
  trucks: {
    backToHome: "Back to home",
    specsTitle: "Specifications",
    goodFor: "Good for",
    bodyType: "Body type",
    cta: "Get a price for this truck",
    sampleNotice: "Sample specifications for testing. The real catalogue is coming soon.",
    bodyTypes: {
      mini: "Mini truck",
      pickup: "Pickup",
      closed: "Closed body",
      container: "Container",
      open: "Open body",
      trailer: "Trailer",
      reefer: "Refrigerated",
    },
  },
  company: {
    contactTitle: "Contact",
    legalTitle: "Legal",
    forBusinessTitle: "For businesses",
    partnersTitle: "Partners",
    companyTitle: "Company",
    phone: "Phone",
    email: "Email",
    whatsapp: "WhatsApp",
    cin: "CIN",
    gstin: "GSTIN",
    address: "Registered office",
    hours: "Support hours",
    socialTitle: "Follow us",
  },
  /**
   * Hero copy variants for the Phase 9 A/B tests (English only for now).
   * `a` is the control and must match the page's own hero copy above
   * (scripts/check-translations.mjs enforces it). Pick the live variant in
   * src/lib/experiments.ts. Every variant only says things the site already
   * claims; none needs a new fact from the client.
   */
  heroVariants: {
    home: {
      a: {
        title: "Book a truck like you book a cab.",
        lead: "Enter your route, pick a truck, see the fare. A vetted transporter takes it from there.",
        cta: "Get price",
      },
      b: {
        title: "See the truck fare before you book.",
        lead: "Enter pickup and drop, choose a truck and get a fare range. No sign-up, no broker calls.",
        cta: "See my fare",
      },
      c: {
        title: "Full truckloads, fare up front.",
        lead: "Tell us the route and the truck. You see the fare range; a vetted transporter moves the load.",
        cta: "Check the fare",
      },
    },
    shippers: {
      a: {
        title: "Trucks for your business, fare up front.",
        lead: "For manufacturers, distributors and traders who move full truckloads. See the fare, book a vetted transporter, skip the broker calls.",
        cta: "Open a business account",
      },
      b: {
        title: "Stop calling brokers for every load.",
        lead: "One request, a fare range up front and a vetted transporter for each full truckload. For manufacturers, distributors and traders.",
        cta: "Open a business account",
      },
      c: {
        title: "Move full truckloads without the haggling.",
        lead: "See the fare before you book and work only with vetted transporters. Set up once, book whenever you need a truck.",
        cta: "Set up a business account",
      },
    },
    transporters: {
      a: {
        title: "Get loads at a known fare. No bidding.",
        lead: "For fleet owners with 1–10 trucks. Apply in 2 minutes; we'll call you to verify.",
        cta: "Apply to join",
      },
      b: {
        title: "Loads at a set fare, not a bidding war.",
        lead: "Own 1–10 trucks? See the fare before you accept a load. Apply in 2 minutes and we'll call you to verify.",
        cta: "Apply now",
      },
      c: {
        title: "Know the fare before you take the load.",
        lead: "For fleet owners with 1–10 trucks. Apply in 2 minutes; documents go over WhatsApp, not uploads.",
        cta: "Start your application",
      },
    },
  },
  support: {
    topic: "What is this about?",
    topics: [
      { value: "shipper", label: "I need a truck" },
      { value: "transporter", label: "I own trucks" },
      { value: "press", label: "Press or partnership" },
      { value: "other", label: "Something else" },
    ],
    company: "Company",
    message: "Your message",
    messageHint: "A few lines is enough. At least 10 characters.",
    messageError: "Tell us a little more (at least 10 characters).",
    emailError: "Enter a valid email, or leave it blank.",
    submit: "Send message",
    successTitle: "Message received",
    successBody: "Reference {reference}. We'll call you on {phone}.",
    kind: "What do you need?",
    kinds: [
      { value: "complaint", label: "Make a complaint" },
      { value: "access", label: "See the data you hold about me" },
      { value: "correction", label: "Correct my data" },
      { value: "erasure", label: "Delete my data" },
    ],
    reference: "Booking or reference number",
    referenceHint: "If you have one, e.g. TB-1A2B3C.",
    submitGrievance: "Submit request",
    grievanceSuccessTitle: "Request received",
    grievanceSuccessBody:
      "Reference {reference}. Keep it for your records. We may call {phone} to confirm it's you before we act on a data request.",
  },
  safety: {
    meta: {
      title: "How we vet every transporter",
      description:
        "What TruckBuck checks before a transporter can take your load, how cargo and drivers are kept safe, and what is still being built.",
    },
    hero: {
      eyebrow: "Trust and safety",
      title: "How we vet every transporter",
      lead: "Only vetted transporters can accept a load on TruckBuck. Here is what we check, step by step, and what we are still building.",
    },
    pipeline: {
      title: "The vetting pipeline",
      lead: "A transporter moves to the next step only when the one before it passes.",
      stepLabel: "Step {n}",
      steps: [
        {
          key: "vetKyc",
          title: "Identity (KYC)",
          body: "Owner identity verified digitally with PAN and Aadhaar through DigiLocker or Setu.",
          note: "Digital KYC is planned. Today we check the owner's PAN with their other documents.",
        },
        {
          key: "vetVehicleDocs",
          title: "Vehicle papers",
          body: "RC, insurance and permit checked for every truck the transporter adds.",
          note: "",
        },
        {
          key: "vetDriverLicence",
          title: "Driver licence",
          body: "Each driver's licence checked before they can be assigned a trip.",
          note: "",
        },
        {
          key: "vetFirstTrip",
          title: "First-trip review",
          body: "Our team follows the transporter's first trip from pickup to delivery and reviews it.",
          note: "",
        },
        {
          key: "vetRatingThreshold",
          title: "Ongoing rating",
          body: "Shippers rate every trip. A transporter whose average falls below {rating} out of 5 is suspended automatically until we review it.",
          note: "",
        },
      ],
    },
    cargo: {
      title: "Keeping your cargo safe",
      lead: "What happens to your goods between pickup and drop.",
      items: {
        podPhotoSignature: {
          title: "Proof of delivery",
          body: "A photo and the receiver's e-signature at drop, shared with you.",
        },
        liveTracking: { title: "Live tracking", body: "Follow the truck from pickup to drop." },
        incidentProcess: {
          title: "If something goes wrong",
          body: "Report damage, delay or loss to us. We log it, inform both sides and follow it until it's closed.",
        },
        insuranceGuidance: {
          title: "Insurance guidance",
          body: "We tell you in writing what is and isn't covered for your booking.",
        },
      },
    },
    insurance: {
      title: "Insurance: what is and isn't covered",
      paragraphs: [
        "A truck's own motor insurance covers the vehicle and third parties. It does not cover the goods it carries.",
        "If your goods need cover, arrange goods-in-transit insurance before the trip and tell us. We'll confirm in writing what is covered for your booking, and by whom.",
      ],
    },
    driver: {
      title: "Keeping drivers safe",
      lead: "Rested drivers on sensible schedules deliver loads safely.",
      items: {
        noSpeedIncentives: {
          title: "No rewards for speed",
          body: "We never pay drivers or transporters extra for arriving faster than the planned transit time.",
        },
        restStopPolicy: {
          title: "Planned rest stops",
          body: "Transit times include rest breaks, so nobody has to drive through the night to make a deadline.",
        },
        safetyWeightedRewards: {
          title: "Rewards for safe driving",
          body: "Driver rewards will be weighted on safety, not on how many trips a driver squeezes in.",
        },
      },
    },
    cta: {
      title: "Questions about safety?",
      body: "Talk to our team before you book.",
      contact: "Contact us",
    },
  },
  about: {
    meta: {
      title: "About TruckBuck",
      description: "Why TruckBuck exists, the company behind it and how to reach us.",
    },
    hero: {
      eyebrow: "About us",
      title: "Booking a truck should be as simple as booking a cab.",
      lead: "TruckBuck connects businesses that move full truckloads with vetted transporters, at a fare they can see up front, and builds its app around the drivers who do the work.",
    },
    missionTitle: "Our mission",
    mission: "Make full-truck booking simple and fair for shippers, transporters and drivers.",
    storyTitle: "Why we started",
    homeRegion: "Based in {region}.",
    teamTitle: "The team",
    countersTitle: "TruckBuck so far",
    counters: {
      trips_completed: "trips completed",
      transporters_onboarded: "transporters onboarded",
      asOf: "Counted on {date}",
    },
    companyTitle: "Company details",
    facts: {
      legalName: "Registered name",
      address: "Registered office",
      cin: "CIN",
      gstin: "GSTIN",
      founded: "Founded",
      msme: "MSME (Udyam)",
      startup: "DPIIT recognition (Startup India)",
    },
    cta: { title: "Want to work with us?", body: "Tell us what you move or what you drive." },
  },
  contact: {
    meta: {
      title: "Contact TruckBuck",
      description:
        "Call, WhatsApp or write to TruckBuck. Separate lines for shippers, transporters and press.",
    },
    hero: {
      eyebrow: "Contact",
      title: "Talk to us",
      lead: "Send a message and we'll call you back. Need a fare? The instant estimate is quicker.",
    },
    linesTitle: "Reach the right team",
    lines: {
      shippers: { title: "Shippers", body: "Bookings, fares and business accounts." },
      transporters: { title: "Transporters", body: "Joining the network and your loads." },
      press: { title: "Press and partnerships", body: "Media, partnerships and investors." },
    },
    phone: "Phone",
    email: "Email",
    whatsappTitle: "WhatsApp",
    whatsappBody: "The quickest way to reach us.",
    hours: "Hours",
    officeTitle: "Registered office",
    mapLabel: "Map showing TruckBuck's registered office",
    showMap: "Show map",
    openInMaps: "Open in Google Maps",
    formTitle: "Send us a message",
    formLead: "We'll reply by phone. Add your email if you'd rather get an email.",
  },
  help: {
    meta: {
      title: "Help centre",
      description:
        "Answers about booking a truck, fares, joining as a transporter, the driver app and your data.",
    },
    hero: {
      eyebrow: "Help",
      title: "How can we help?",
      lead: "Search the answers or browse by topic.",
    },
    searchLabel: "Search help",
    searchPlaceholder: "e.g. how is the fare calculated",
    resultsCount: "{count} answers",
    resultsOne: "1 answer",
    noResults: "No answers match “{query}”. Try fewer words, or ask us below.",
    browseTitle: "Browse by topic",
    categories: {
      booking: "Booking",
      pricing: "Pricing",
      payments: "Payments",
      cancellation: "Cancellation",
      tracking: "Tracking",
      transporters: "Transporters",
      drivers: "Drivers",
      account: "Account and your data",
    },
    allTopics: "All help topics",
    moreIn: "More in {category}",
    readAnswer: "Read the answer",
    stillNeedHelp: {
      title: "Still need help?",
      body: "Message us on WhatsApp, or send us a message and we'll call you.",
      whatsapp: "Chat on WhatsApp",
      contact: "Contact us",
    },
    extraFaqs: [
      {
        slug: "is-gst-included",
        category: "pricing",
        question: "Is GST included in the estimate?",
        answer: "Yes. The fare range includes GST at the rate shown under the estimate.",
      },
      {
        slug: "does-the-website-take-payment",
        category: "payments",
        question: "Do I pay anything on the website?",
        answer: "No. Fare estimates and callbacks are free, and the website doesn't take payments.",
      },
      {
        slug: "what-documents-do-transporters-need",
        category: "transporters",
        question: "What documents do I need to join?",
        answer:
          "RC, insurance and permit for each truck, your PAN card, bank details for payouts, and a licence for each driver. A GST certificate is optional. We collect them on WhatsApp during verification.",
      },
      {
        slug: "how-are-transporters-vetted",
        category: "transporters",
        question: "How do you vet transporters?",
        answer:
          "Every transporter is checked before they can accept a load. Our safety page shows each step.",
      },
      {
        slug: "how-do-i-get-my-data-deleted",
        category: "account",
        question: "How do I see, correct or delete my data?",
        answer:
          "Use the request form on our grievance page. Choose what you need, and we'll confirm it's you before acting on it.",
      },
    ],
  },
  missingFact: {
    label: "Needs from client",
  },
  common: {
    roadmap: "Coming soon",
    sample: "Sample",
    optional: "optional",
    back: "Back",
    next: "Next",
    edit: "Edit",
    approx: "approx.",
    stepOf: "Step {current} of {total}",
    completed: "completed",
    faqTitle: "Frequently asked questions",
    languageLabel: "Language",
    languageLabelFooter: "Choose your language",
    pauseAnimation: "Pause animation",
    playAnimation: "Play animation",
    reviewNotice: "",
  },
  features: {
    upfrontFare: {
      title: "Fare up front",
      body: "See a fare range before you book. No calling five brokers for a price.",
    },
    vettedNetwork: {
      title: "Vetted transporters only",
      body: "Every transporter is checked before they can accept your load. Not an open load board.",
    },
    liveTracking: {
      title: "Live trip status",
      body: "Know where your load is without chasing the driver on the phone.",
    },
    podPhotoSignature: {
      title: "POD with photo and signature",
      body: "Proof of delivery captured at drop, shared with you the same day.",
    },
    gstInvoices: {
      title: "GST invoices",
      body: "A proper tax invoice for every trip, ready for your books.",
    },
    tripReports: {
      title: "Trip history and cost reports",
      body: "Every trip and what it cost, by lane and month.",
    },
    teamAccounts: {
      title: "Team accounts",
      body: "Let your dispatch and accounts teams book and track under one company.",
    },
    steadyLoads: {
      title: "Steady loads",
      body: "Loads from shippers who book regularly, on lanes you choose.",
    },
    noBidding: {
      title: "No bidding wars",
      body: "The fare is set before you see the load. Accept it or pass.",
    },
    transparentFee: {
      title: "A clear per-trip fee",
      body: "One fee per trip, shown before you accept. No hidden deductions.",
    },
    onTimePayment: {
      title: "Paid on time",
      body: "Payment on a fixed schedule after proof of delivery.",
    },
    driverAssignment: {
      title: "Simple driver assignment",
      body: "Assign a truck and driver to a trip in a few taps.",
    },
  },
  forms: {
    name: "Your name",
    ownerName: "Owner's name",
    phone: "Mobile number",
    city: "City",
    email: "Email",
    nameError: "Enter your name.",
    phoneError: "Enter a 10-digit mobile number, like 98765 43210.",
    cityError: "Enter your city.",
    required: "Fill in this field.",
    consent: "We'll use these details only to contact you about this request. See our",
    privacyLink: "Privacy Policy",
    submitting: "Sending…",
    errors: {
      invalid: "Check the highlighted fields.",
      rate_limited: "Too many requests. Wait a few minutes and try again.",
      bot_check: "We couldn't confirm you're not a bot. Refresh the page and try again.",
      unavailable: "We couldn't send this right now. Try again, or contact us on WhatsApp.",
    },
    reference: "Reference {reference}",
  },
  shippers: {
    meta: {
      title: "Truck booking for businesses",
      description:
        "Full-truck bookings for manufacturers, distributors and traders: fare up front, vetted transporters only.",
    },
    hero: {
      eyebrow: "For businesses",
      title: "Trucks for your business, fare up front.",
      lead: "For manufacturers, distributors and traders who move full truckloads. See the fare, book a vetted transporter, skip the broker calls.",
      cta: "Open a business account",
      secondary: "Get a price now",
    },
    problems: {
      title: "What we fix",
      items: [
        {
          title: "Endless broker calls",
          body: "One request instead of calling around for a truck.",
        },
        {
          title: "Haggling over price",
          body: "A fare range before you book, not a number that changes on every call.",
        },
        { title: "No idea where the load is", body: "Trip status without chasing the driver." },
        { title: "Lost PODs", body: "Proof of delivery that doesn't get lost in a cab." },
      ],
    },
    featuresTitle: "What you get",
    form: {
      title: "Open a business account",
      lead: "Tell us about your shipping. Our team will call you to set it up.",
      company: "Company name",
      gstin: "GSTIN",
      gstinHint: "15 characters. It starts with your state code.",
      gstinError: "Enter a valid 15-character GSTIN.",
      monthlyTrips: "Trucks you book per month",
      monthlyTripsOptions: [
        { value: "1-5", label: "1–5" },
        { value: "6-20", label: "6–20" },
        { value: "21-50", label: "21–50" },
        { value: "50+", label: "50+" },
      ],
      lanes: "Your usual routes",
      lanesHint: "e.g. Chennai to Bengaluru, Coimbatore to Kochi",
      lanesError: "Tell us at least one route.",
      contactTitle: "Who should we call?",
      submit: "Request a call",
      successTitle: "Thanks — we'll call you",
      successBody:
        "Reference {reference}. Our team will call {phone} to set up your business account.",
    },
    final: {
      title: "Ready for your next load?",
      body: "Get a fare for one trip now, or set up a business account.",
    },
  },
  transporters: {
    meta: {
      title: "Join as a transporter",
      description:
        "Own 1–10 trucks? Get loads at a known fare in TruckBuck's closed, vetted network. Apply in 2 minutes.",
    },
    hero: {
      eyebrow: "Now onboarding transporters",
      title: "Get loads at a known fare. No bidding.",
      lead: "For fleet owners with 1–10 trucks. Apply in 2 minutes; we'll call you to verify.",
      cta: "Apply to join",
    },
    benefitsTitle: "Why transporters join",
    vetting: {
      title: "How vetting works",
      lead: "We check every transporter before they can accept a load. That keeps the network trusted, for you and for shippers.",
      steps: [
        { title: "Apply here", body: "Two short steps. No documents to upload on the website." },
        { title: "We call you", body: "Our team calls to understand your fleet and lanes." },
        {
          title: "Share documents on WhatsApp",
          body: "Send the documents below on WhatsApp. We check them with you.",
        },
        {
          title: "First load",
          body: "Once verified, you start seeing loads that fit your trucks.",
        },
      ],
      timeline: "Verification time",
      documentsTitle: "Documents you'll need",
      documents: [
        "RC (registration certificate) for each truck",
        "Insurance for each truck",
        "Permit for each truck",
        "PAN card",
        "GST certificate (optional)",
        "Bank account details for payments",
        "Driving licence for each driver",
      ],
      noUpload:
        "Don't upload documents on this website. We'll collect them on WhatsApp during verification.",
    },
    fee: {
      title: "How our fee works",
      lead: "A per-trip fee, shown before you accept a load.",
      percent: "Fee per trip",
      minimum: "Minimum per trip",
      payout: "Payment after proof of delivery",
      payoutValue: "within {days} days",
      percentValue: "{percent}% of the trip fare",
    },
    form: {
      title: "Apply to join",
      lead: "Takes about 2 minutes. Your answers are saved on this phone if you need to stop.",
      steps: ["You", "Your fleet"],
      fleetSize: "How many trucks do you own?",
      fleetSizeOptions: [
        { value: "1", label: "1" },
        { value: "2-5", label: "2–5" },
        { value: "6-10", label: "6–10" },
        { value: "10+", label: "10+" },
      ],
      fleetSizeError: "Choose how many trucks you own.",
      truckTypes: "Truck types",
      truckTypesHint: "Choose all that apply.",
      truckTypesError: "Choose at least one truck type.",
      homeBase: "Home base",
      homeBaseHint: "Where your trucks usually start from.",
      homeBaseError: "Enter your home base.",
      lanes: "Preferred routes",
      lanesHint: "e.g. Chennai – Bengaluru, Tamil Nadu – Kerala",
      next: "Next",
      back: "Back",
      submit: "Send application",
      restored: "We kept your answers from last time.",
      successTitle: "Application received",
      successBody: "Reference {reference}. We'll call {phone} to start verification.",
      whatsappNext: "Next: keep your documents ready. We'll ask for them on WhatsApp.",
      whatsappAck: "Message us on WhatsApp",
      whatsappAckText: "Hi TruckBuck, I just applied as a transporter. Reference {reference}.",
    },
    final: { title: "Ready to join?", body: "Apply in 2 minutes. No documents to upload." },
  },
  drivers: {
    meta: {
      title: "TruckBuck driver app",
      description:
        "The TruckBuck driver app: trip details in a few taps, built for low-cost Android phones and weak signal.",
    },
    hero: {
      eyebrow: "For drivers",
      title: "Your trips, in a few taps.",
      lead: "The TruckBuck driver app is built for low-cost Android phones and weak signal, with updates on WhatsApp.",
      qrTitle: "Scan to get the app",
      qrAlt: "QR code linking to the TruckBuck driver app on Google Play",
    },
    appTitle: "What the app does",
    screens: {
      tripDetails: {
        title: "Trip details",
        body: "Pickup, drop and contact numbers on one screen.",
      },
      navigate: { title: "Directions", body: "One tap opens the route in your maps app." },
      pod: { title: "Proof of delivery", body: "Take a photo at drop. No paperwork to lose." },
      whatsapp: {
        title: "Updates on WhatsApp",
        body: "Trip updates arrive on WhatsApp too, even if the app is closed.",
      },
    },
    builtFor: {
      title: "Built for the road",
      items: [
        {
          title: "Built for low-cost phones",
          body: "Made for budget Android phones, not just flagships.",
        },
        { title: "Works on a weak signal", body: "Built for highways, not just cities." },
        { title: "Few taps", body: "Big buttons, simple screens." },
      ],
    },
    rewards: {
      title: "Rewards for safe driving",
      badge: "Coming soon",
      body: "We're building a rewards programme for drivers who drive safely. Rewards will be things you use every day, like fuel and mobile recharge. Join the waitlist to hear first.",
      form: {
        transporter: "Transporter you drive for",
        submit: "Join the waitlist",
        successTitle: "You're on the waitlist",
        successBody: "Reference {reference}. We'll message {phone} when rewards start.",
      },
    },
    final: { title: "Get the driver app", body: "Free on Google Play." },
  },
  trucksPage: {
    meta: {
      title: "Truck types",
      description:
        "Mini trucks to large containers: sizes, payloads and what fits. Pick the right truck and get a fare.",
    },
    title: "Truck types",
    listTitle: "All trucks we book",
    lead: "Sizes and payloads for every truck we book. Not sure? Use the helper below.",
    cta: "Get a price",
    specsTitle: "Specifications",
    spec: {
      payload: "Payload",
      length: "Length",
      width: "Width",
      height: "Height",
      bodyType: "Body",
      pallets: "What fits",
    },
    palletsValue: "approx. {count} standard pallets",
    goodsTitle: "Suitable goods",
    relatedTitle: "Similar trucks",
    quoteTitle: "Get a price for this truck",
    helper: {
      title: "Which truck do I need?",
      lead: "Tell us the weight and what you're sending. We'll suggest a truck.",
      weight: "Weight (tonnes)",
      weightError: "Enter a weight between 0.1 and 60 tonnes.",
      volume: "Volume (cubic feet)",
      volumeHint: "Optional. Length × width × height of the load, in feet.",
      material: "What are you sending?",
      materials: [
        { value: "general", label: "Cartons or general goods" },
        { value: "pallets", label: "Palletised goods" },
        { value: "heavy", label: "Steel, machinery or building material" },
        { value: "fragile", label: "Electronics or weather-sensitive" },
        { value: "perishable", label: "Food or pharma that needs cooling" },
      ],
      submit: "Suggest a truck",
      result: "We suggest: {name}",
      why: "{payload} t payload, {length} ft long. Fits your load with room to spare.",
      tooHeavy: "That's more than one truck can carry. We'll call you to plan it.",
      none: "No truck in our catalogue fits this. Leave your number and we'll plan it with you.",
      useIt: "Get a price with this truck",
    },
  },
  pricing: {
    meta: {
      title: "How our fares work",
      description:
        "How a TruckBuck fare is built: base fare, distance, surcharges and GST — with a worked example and an estimator.",
    },
    hero: {
      eyebrow: "Pricing",
      title: "How your fare is built.",
      lead: "No haggling and no surprises. Here's exactly what goes into a fare.",
      cta: "Get a price",
    },
    formula: {
      title: "The formula",
      parts: [
        {
          title: "Base fare",
          body: "A fixed amount for the truck type. Covers the truck and driver for the trip.",
        },
        {
          title: "Distance",
          body: "Charged per km by distance band: the further you go, the less each km costs. Short trips are charged a minimum distance.",
        },
        {
          title: "Loading and unloading time",
          body: "Your estimate shows how much loading and unloading time is included.",
        },
        {
          title: "Tolls",
          body: "Your estimate shows whether tolls are included or charged separately for your route.",
        },
        {
          title: "Night and same-day pickups",
          body: "Pickups late at night or within 24 hours add a percentage to the fare.",
        },
        { title: "GST", body: "Added on the total, as required by law." },
      ],
      rangeNote:
        "We show a range, not one number, because exact addresses and loading time change the final fare. You agree the final fare before anything is booked.",
    },
    example: {
      title: "A worked example",
      lead: "{truck}, {km} km, pickup in two days at 10 am.",
      base: "Base fare",
      distanceBand: "{from}–{to} km at {rate}/km",
      distanceBandOpen: "Above {from} km at {rate}/km",
      night: "Night pickup",
      urgent: "Same-day pickup",
      subtotal: "Fare before tax",
      gst: "GST at {pct}%",
      range: "Range you'd see",
      rangeNote:
        "Shown as a range ({low}% below to {high}% above), rounded to the nearest {round}.",
    },
    estimatorTitle: "Try it for your route",
    compare: {
      title: "What's in the fare vs. a typical broker quote",
      caption: "What TruckBuck's fare covers compared with a typical broker quote",
      item: "Item",
      truckbuck: "TruckBuck fare",
      broker: "Typical broker quote",
      rows: [
        {
          item: "Price known before booking",
          truckbuck: "Yes, as a range",
          broker: "After negotiation",
        },
        {
          item: "What's included is written down",
          truckbuck: "Listed in every estimate",
          broker: "Often agreed on the phone",
        },
        { item: "Transporter checked", truckbuck: "Always", broker: "Varies" },
      ],
    },
    charges: {
      title: "Waiting, cancellation and payment",
      waiting: "Waiting time",
      waitingValue: "{free} hours free, then {rate} per hour",
      cancellation: "Cancellation",
      payment: "Payment terms",
    },
    final: { title: "See your fare", body: "It takes under a minute." },
  },
  howItWorks: {
    meta: {
      title: "How TruckBuck works",
      description:
        "From request to proof of delivery: how a TruckBuck booking works for shippers, transporters and drivers.",
    },
    hero: {
      eyebrow: "How it works",
      title: "From request to proof of delivery.",
      lead: "One booking, three people. Here's what happens at each step and who does what.",
      cta: "Get a price",
    },
    tabsLabel: "Show steps for",
    lifecycleTitle: "The booking, step by step",
    roles: { shipper: "Shipper", transporter: "Transporter", driver: "Driver" },
    noAction: "Nothing to do at this step.",
    stepLabel: "Step {n}",
    steps: [
      {
        key: "request",
        title: "Request",
        shipper: "Enter pickup, drop and truck type.",
        transporter: "",
        driver: "",
      },
      {
        key: "estimate",
        title: "Estimate",
        shipper: "See a fare range straight away.",
        transporter: "",
        driver: "",
      },
      {
        key: "confirm",
        title: "Confirm",
        shipper: "Confirm the details and the final fare with our team.",
        transporter: "",
        driver: "",
      },
      {
        key: "offer",
        title: "Offer to vetted transporters",
        shipper: "",
        transporter:
          "See the load at a known fare. Accept it, or it goes to the next vetted transporter.",
        driver: "",
      },
      {
        key: "assign",
        title: "Assign truck and driver",
        shipper: "Get the truck number and driver's details.",
        transporter: "Pick the truck and driver for the trip.",
        driver: "Get the trip on your phone.",
      },
      {
        key: "status",
        title: "Live status",
        shipper: "See where your load is.",
        transporter: "Follow your trucks on the road.",
        driver: "Update the trip in a tap.",
      },
      {
        key: "pod",
        title: "Proof of delivery",
        shipper: "Get the POD when the load is delivered.",
        transporter: "POD is attached to the trip.",
        driver: "Take a photo at drop.",
      },
      {
        key: "payment",
        title: "Payment and invoice",
        shipper: "Get your invoice.",
        transporter: "See payment status for the trip.",
        driver: "",
      },
      {
        key: "rating",
        title: "Rating",
        shipper: "Rate the trip.",
        transporter: "See how shippers rate you.",
        driver: "",
      },
    ],
    final: { title: "Start with a price", body: "Step one takes under a minute." },
  },
  pageFaqs: {
    /** Mirrors the home FAQ seed in Supabase; used for translated home pages. */
    home: [
      {
        question: "What is a full truck load (FTL)?",
        answer:
          "You book the whole truck for your goods. Nobody else's load shares it, so it goes straight from pickup to drop.",
      },
      {
        question: "Do I need to sign up to see a price?",
        answer:
          "No. Enter pickup, drop and truck type to see a fare range. Leave your number only if you want us to call you.",
      },
      {
        question: "How is the fare calculated?",
        answer:
          "From the road distance, the truck type and the pickup time. Night and same-day pickups can cost more. The estimate lists what is included and what is not.",
      },
      {
        question: "Why do I see a range, not one price?",
        answer:
          "The final fare depends on details we confirm with you, such as exact addresses and loading time. You agree the final fare before anything is booked.",
      },
      {
        question: "Who carries my goods?",
        answer:
          "A transporter from TruckBuck's closed network. Every transporter is checked before they can accept a load. It is not an open load board.",
      },
      {
        question: "What happens after I ask for a callback?",
        answer:
          "Our team calls the number you gave, confirms the details and the fare, and assigns a vetted transporter.",
      },
      {
        question: "Can I continue on WhatsApp instead?",
        answer:
          "Yes. After you see your fare, tap Continue on WhatsApp. The message already includes your route, truck and estimate.",
      },
      {
        question: "Which cities do you serve?",
        answer:
          "See the coverage map on this page. If your route is not listed, leave your number and we will call you if we can help.",
      },
    ],
    shippers: [
      {
        question: "Do I need an account to book?",
        answer:
          "No. You can get a price and request a callback without an account. A business account helps if you ship regularly.",
      },
      {
        question: "What is a full truck load (FTL)?",
        answer: "You book the whole truck for your goods. Nobody else's load shares it.",
      },
      {
        question: "Who carries my goods?",
        answer:
          "A transporter from TruckBuck's closed network. Every transporter is checked before they can accept a load.",
      },
      {
        question: "Why do you ask for my GSTIN?",
        answer:
          "So we can set up your business account correctly. It's optional when you first contact us.",
      },
    ],
    transporters: [
      {
        question: "How long does applying take?",
        answer:
          "About 2 minutes on your phone: a few questions about you and your trucks. Then we call you to verify.",
      },
      {
        question: "Do I have to upload documents on the website?",
        answer: "No. Apply here, and we'll collect documents on WhatsApp during verification.",
      },
      {
        question: "Can I choose my routes?",
        answer: "Yes. Tell us your preferred routes when you apply.",
      },
      {
        question: "Do I have to bid for loads?",
        answer: "No. The fare is set before you see a load. Accept it or pass.",
      },
    ],
    drivers: [
      {
        question: "Is the app free?",
        answer: "Yes. The TruckBuck driver app is free on Google Play.",
      },
      {
        question: "Will it work on my phone?",
        answer:
          "It's built for Android phones, including low-cost ones, and for weak signal on highways.",
      },
      {
        question: "My transporter isn't on TruckBuck. Can I still use it?",
        answer:
          "You need a transporter in the TruckBuck network. Ask your owner to apply, or share our transporters page with them.",
      },
      {
        question: "What will the rewards be?",
        answer:
          "Things you use every day, like fuel and mobile recharge, for driving safely. The programme is coming soon.",
      },
    ],
    trucks: [
      {
        question: "How do I pick the right truck?",
        answer: "Use the helper on this page with your weight and goods, or ask us when we call.",
      },
      {
        question: "Is the payload a legal limit?",
        answer:
          "Payloads shown are typical figures for each truck class. The exact limit depends on the vehicle's registration.",
      },
    ],
    pricing: [
      {
        question: "Is the estimate the final price?",
        answer: "It's a range. The final fare is confirmed with you before anything is booked.",
      },
      {
        question: "Are tolls included?",
        answer:
          "Your estimate lists exactly what's included and what's charged separately, including tolls.",
      },
      {
        question: "Why do night and same-day pickups cost more?",
        answer:
          "They need trucks and drivers at short notice or at night. The extra is a fixed percentage, shown in your estimate.",
      },
    ],
    howItWorks: [
      {
        question: "What happens if a transporter doesn't accept?",
        answer:
          "The load is offered to the next vetted transporter, so you don't have to start again.",
      },
    ],
  },
  legal: {
    lastUpdatedLabel: "Last updated",
    draftNotice:
      "DRAFT – review by lawyer. This text has not been approved by counsel and is not in force yet (NFC-19).",
    contentsTitle: "On this page",
    /** Shown in production where a fact is still missing; development shows a marker instead. */
    fallbacks: {
      legalName: "TruckBuck",
      address: "its registered office",
      grievanceContact: "our Grievance Officer through the form on our grievance page",
      ackTimeline: "the time the law allows",
      resolveTimeline: "the time the law allows",
      leadRetention: "they are no longer needed",
      paymentTerms: "the payment terms confirmed in your booking",
      cancellationTerms: "the cancellation terms confirmed in your booking",
      feePercent: "the per-trip fee shown before you accept a load",
      payoutTimeline: "on the schedule in your transporter agreement",
      jurisdiction: "the place of our registered office",
      refundDays: "a reasonable time",
    },
    formats: {
      days: "{n} days",
      workingDays: "{n} working days",
      months: "{n} months",
      fee: "a per-trip fee of {percent}% of the trip fare",
      payout: "within {n} days of proof of delivery",
      officer: "our Grievance Officer, {name} ({designation}), at {email}",
    },
  },
  privacy: {
    title: "Privacy Policy",
    description:
      "What personal data TruckBuck collects, why, how long we keep it and your rights under the DPDP Act, 2023.",
    lastUpdated: "2026-11-24",
    intro:
      "This notice explains what personal data {legalName} (“TruckBuck”, “we”) collects through truckbuck.in and the TruckBuck driver app, why we collect it, how long we keep it, and the rights you have under the Digital Personal Data Protection Act, 2023 (the DPDP Act).",
    sections: [
      {
        heading: "Who we are",
        paragraphs: [
          "{legalName}, with its registered office at {address}, is the Data Fiduciary for the personal data described here.",
        ],
        items: [],
      },
      {
        heading: "What we collect and why",
        paragraphs: ["We collect only what each task needs:"],
        items: [
          "Fare estimates: pickup and drop places, truck type, pickup date, and optionally weight and material, to calculate a fare range. You don't need to give your name for this.",
          "Callback, contact and business-account forms: your name and mobile number, and optionally email, company, GSTIN and city, to contact you about your request.",
          "Transporter applications: owner name, mobile number, city, fleet size, truck types, home base and preferred routes. During verification, the documents you send us (RC, insurance, permit, PAN, GST certificate, bank details and driver licences), to verify you and pay you.",
          "Driver app: name, mobile number, licence details, trip records and the phone's location while a trip is active, to show the trip to the shipper and transporter and to resolve disputes.",
          "Technical data: a one-way hash of your IP address (for rate limiting), the page you came from and campaign tags, to protect the site from abuse and to see which channels bring enquiries.",
          "Cookies: a language-preference cookie (tb_locale) and the security cookies our bot-protection provider, Cloudflare Turnstile, needs. We don't use advertising or analytics cookies.",
        ],
      },
      {
        heading: "Why we're allowed to use it",
        paragraphs: [
          "We process your personal data with the consent you give when you submit a form or use the app, or for the legitimate uses the DPDP Act allows, such as meeting a legal obligation.",
          "You can withdraw consent at any time through our grievance page. Withdrawing doesn't affect processing already done, but we may no longer be able to provide the service.",
        ],
        items: [],
      },
      {
        heading: "Who we share it with",
        paragraphs: ["We don't sell personal data. We share it only with:"],
        items: [
          "the transporter and driver assigned to your booking, and only what they need for the trip;",
          "service providers who process data for us under contract: website hosting (Vercel), database (Supabase), maps (Google Maps Platform), bot protection (Cloudflare) and WhatsApp messaging (Meta);",
          "authorities, when the law requires it.",
        ],
      },
      {
        heading: "Where your data is stored",
        paragraphs: [
          "Some of our service providers may store or process data outside India. We transfer personal data only to countries the Government of India has not restricted under section 16 of the DPDP Act.",
        ],
        items: [],
      },
      {
        heading: "How long we keep it",
        paragraphs: [
          "We keep personal data only for as long as we need it for the purpose we collected it for, or for longer if the law requires (for example, tax and accounting records).",
          "Enquiries that don't lead to a booking are deleted after {leadRetention}. Short-lived security records, such as rate-limit counters and cached route lookups, are deleted automatically.",
        ],
        items: [],
      },
      {
        heading: "Your rights",
        paragraphs: ["Under the DPDP Act you can:"],
        items: [
          "get a summary of the personal data we hold about you and how we use it;",
          "have inaccurate or incomplete data corrected, completed or updated;",
          "have your data erased when it's no longer needed, unless the law requires us to keep it;",
          "withdraw consent;",
          "nominate someone to exercise these rights if you die or become unable to;",
          "have a grievance heard and resolved.",
        ],
      },
      {
        heading: "How to use your rights",
        paragraphs: [
          "Send a request through the form on our grievance page. We may need to confirm it's you before we act on a request about your data.",
        ],
        items: [],
      },
      {
        heading: "Children",
        paragraphs: [
          "Our services are for businesses and working adults. We don't knowingly collect personal data from anyone under 18. If you think we have, tell us and we'll delete it.",
        ],
        items: [],
      },
      {
        heading: "Security and breaches",
        paragraphs: [
          "We protect personal data with encryption in transit, access controls and database row-level security. If a personal data breach happens, we will inform the Data Protection Board of India and the people affected, as the law requires.",
        ],
        items: [],
      },
      {
        heading: "Grievance Officer",
        paragraphs: [
          "Contact {grievanceContact}. We acknowledge a grievance within {ackTimeline} and resolve it within {resolveTimeline}.",
          "If you're not satisfied with our response, you can complain to the Data Protection Board of India.",
        ],
        items: [],
      },
      {
        heading: "Changes to this policy",
        paragraphs: [
          "We'll publish any change here with a new date. If a change affects how we use data you have already given us, we'll tell you before it applies.",
        ],
        items: [],
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    description:
      "The terms for using truckbuck.in and booking or carrying loads through TruckBuck.",
    lastUpdated: "2026-11-24",
    intro:
      "These terms apply when you use truckbuck.in or TruckBuck's services. By using them, you agree to these terms. Some sections apply only to shippers and some only to transporters.",
    sections: [
      {
        heading: "Who we are",
        paragraphs: [
          "TruckBuck is operated by {legalName}, registered office {address}. TruckBuck runs a closed network that connects shippers who need full truckloads with transporters it has vetted.",
        ],
        items: [],
      },
      {
        heading: "Using the website",
        paragraphs: [],
        items: [
          "Fare estimates are ranges based on the details you enter. They are not offers. The final fare is confirmed with you before anything is booked.",
          "Give accurate details in every form.",
          "Don't misuse the site: no automated scraping, no false information and no attempts to get around its security.",
        ],
      },
      {
        heading: "If you are a shipper",
        paragraphs: [],
        items: [
          "Describe your goods, their weight and the pickup and drop addresses accurately.",
          "Don't book illegal goods. Don't book hazardous goods unless we have agreed to it in writing.",
          "Have the goods ready to load at the agreed time, and arrange loading and unloading unless your booking says otherwise.",
          "Provide the documents the law requires for your goods, such as invoices and e-way bills.",
          "Pay according to {paymentTerms}.",
          "Cancellations are governed by {cancellationTerms}.",
          "Report loss, damage or delay to us in writing as soon as you notice it, with the delivery notes.",
        ],
      },
      {
        heading: "If you are a transporter",
        paragraphs: [],
        items: [
          "Pass our vetting before accepting loads, and keep every vehicle's RC, insurance and permit, and every driver's licence, valid.",
          "Assign only licensed drivers who are fit to drive, and never overload a vehicle beyond its permitted weight.",
          "Follow the Motor Vehicles Act and all other laws that apply to the trip.",
          "TruckBuck charges {feePercent}. Payouts are made {payoutTimeline}.",
          "We may suspend a transporter whose ratings fall below our threshold, or who breaks these terms, while we review it.",
        ],
      },
      {
        heading: "Liability",
        paragraphs: [
          "We are responsible for providing our services with reasonable care and skill. We are not liable for losses we could not reasonably foresee. Our liability for any booking is limited to the extent the law allows.",
          "Nothing in these terms limits any liability that cannot be limited by law.",
        ],
        items: [],
      },
      {
        heading: "Governing law and disputes",
        paragraphs: [
          "These terms are governed by the laws of India. Disputes go to the courts at {jurisdiction}.",
        ],
        items: [],
      },
      {
        heading: "Changes to these terms",
        paragraphs: [
          "We'll publish any change here with a new date. Changes don't affect bookings already confirmed.",
        ],
        items: [],
      },
    ],
  },
  refundPolicy: {
    title: "Refund and Cancellation Policy",
    description: "How cancellations and refunds work for bookings made through TruckBuck.",
    lastUpdated: "2026-11-24",
    intro:
      "This policy explains how cancellations and refunds work for loads booked through TruckBuck.",
    sections: [
      {
        heading: "The website is free",
        paragraphs: [
          "Fare estimates and callback requests on truckbuck.in are free. The website doesn't take payments.",
        ],
        items: [],
      },
      {
        heading: "Cancelling a booking",
        paragraphs: ["Cancellations are governed by {cancellationTerms}."],
        items: [],
      },
      {
        heading: "Refunds",
        paragraphs: [
          "If you have paid for a booking that we or the transporter cancel, or that can't be completed, we refund the amount you paid for the part that wasn't delivered. Refunds go to the original payment method within {refundDays}.",
        ],
        items: [],
      },
      {
        heading: "Disputes about a trip",
        paragraphs: [
          "If you disagree with a charge, raise it through our grievance page with your booking reference. We'll review the trip records and reply.",
        ],
        items: [],
      },
    ],
  },
  grievance: {
    title: "Grievance Redressal",
    description:
      "How to raise a complaint or a data request with TruckBuck's Grievance Officer, and how long we take to respond.",
    lastUpdated: "2026-11-24",
    intro:
      "Use this page to make a complaint about our service or a request about your personal data under the DPDP Act, 2023.",
    officerTitle: "Grievance Officer",
    officerFields: { name: "Name", designation: "Designation", email: "Email", phone: "Phone" },
    timelinesTitle: "How long it takes",
    timelines:
      "We acknowledge your grievance within {ackTimeline} and resolve it within {resolveTimeline}.",
    escalation:
      "If you're not satisfied with our response to a data request, you can complain to the Data Protection Board of India.",
    formTitle: "Raise a grievance or data request",
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
