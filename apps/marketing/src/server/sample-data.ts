import "server-only";

import type { RateCard } from "@truckbuck/pricing";

import type { Faq, Lane, ServiceArea, TruckType } from "./catalog-types";

/*
 * OFFLINE MIRROR of supabase/migrations/20261123130100_sample_seed.sql, used
 * only when Supabase isn't configured (local dev without secrets, CI e2e)
 * AND sample data is allowed. Rates are samples nobody has approved (NFC-2).
 * Keep in sync with the seed migration.
 */

type SampleTruck = [
  string,
  string,
  string,
  TruckType["iconKey"],
  number,
  number,
  string,
  string,
  number,
  number,
  number,
  string[],
];
const truckRows: SampleTruck[] = [
  [
    "mini-truck",
    "Mini truck",
    "mini",
    "mini",
    7,
    0.8,
    "Small cartons, retail stock",
    "mini",
    4.5,
    4,
    2,
    ["Retail stock", "Small cartons", "Parcels"],
  ],
  [
    "pickup-8ft",
    "Pickup 8 ft",
    "pickup",
    "pickup",
    8,
    1.5,
    "Appliances, small furniture",
    "pickup",
    5,
    4.5,
    3,
    ["Appliances", "Small furniture", "Hardware"],
  ],
  [
    "lcv-14ft",
    "LCV 14 ft",
    "closed",
    "lcv",
    14,
    4,
    "FMCG cartons, e-commerce parcels",
    "lcv",
    6,
    6,
    6,
    ["FMCG cartons", "E-commerce parcels", "Textiles"],
  ],
  [
    "lcv-17ft",
    "LCV 17 ft",
    "closed",
    "lcv",
    17,
    5,
    "Furniture, white goods",
    "lcv",
    6.5,
    6.5,
    8,
    ["Furniture", "White goods", "Packaged food"],
  ],
  [
    "mcv-20ft",
    "Truck 20 ft",
    "closed",
    "mcv",
    20,
    7,
    "Pallets, packaged goods",
    "mcv",
    7,
    7,
    10,
    ["Pallets", "Packaged goods", "Auto parts"],
  ],
  [
    "container-32ft",
    "Container 32 ft MXL",
    "container",
    "container",
    32,
    15,
    "High-volume, weather-sensitive cargo",
    "container",
    8,
    8,
    16,
    ["High-volume cartons", "Electronics", "Weather-sensitive goods"],
  ],
  [
    "open-body-22ft",
    "Open body 22 ft",
    "open",
    "open",
    22,
    16,
    "Steel, building material, machinery",
    "hcv",
    7.5,
    3.5,
    12,
    ["Steel", "Building material", "Machinery"],
  ],
  [
    "reefer-20ft",
    "Refrigerated 20 ft",
    "reefer",
    "reefer",
    20,
    6,
    "Dairy, frozen food, pharma",
    "mcv",
    7,
    6.5,
    10,
    ["Dairy", "Frozen food", "Pharmaceuticals"],
  ],
];

export const sampleTrucks: TruckType[] = truckRows.map(
  ([
    slug,
    name,
    bodyType,
    iconKey,
    lengthFt,
    payloadTonnes,
    goodFor,
    truckClass,
    widthFt,
    heightFt,
    pallets,
    typicalLoads,
  ]) => ({
    slug,
    name,
    bodyType,
    iconKey,
    lengthFt,
    payloadTonnes,
    goodFor,
    truckClass,
    widthFt,
    heightFt,
    pallets,
    typicalLoads,
    imageUrl: null,
    imageAlt: null,
    isSample: true,
  }),
);

const slabs3 = (a: number, b: number, c: number) => [
  { upToKm: 100, perKmPaise: a },
  { upToKm: 500, perKmPaise: b },
  { upToKm: null, perKmPaise: c },
];

const cardInputs: [string, number, number, RateCard["kmSlabs"], number][] = [
  [
    "mini-truck",
    150_000,
    25,
    [
      { upToKm: 100, perKmPaise: 2_200 },
      { upToKm: null, perKmPaise: 1_800 },
    ],
    40,
  ],
  [
    "pickup-8ft",
    180_000,
    25,
    [
      { upToKm: 100, perKmPaise: 2_600 },
      { upToKm: null, perKmPaise: 2_100 },
    ],
    40,
  ],
  ["lcv-14ft", 250_000, 50, slabs3(3_800, 3_200, 2_800), 38],
  ["lcv-17ft", 300_000, 50, slabs3(4_300, 3_600, 3_200), 38],
  ["mcv-20ft", 350_000, 50, slabs3(5_000, 4_200, 3_700), 36],
  ["container-32ft", 600_000, 100, slabs3(7_500, 6_200, 5_500), 34],
  ["open-body-22ft", 500_000, 100, slabs3(6_800, 5_600, 5_000), 34],
  ["reefer-20ft", 550_000, 50, slabs3(7_000, 6_000, 5_400), 36],
];

export const sampleRateCards: RateCard[] = cardInputs.map(
  ([slug, base, minKm, kmSlabs, speed]) => ({
    truckTypeSlug: slug,
    version: "sample-2026-11",
    baseFarePaise: base,
    minKm,
    kmSlabs,
    loadingHours: 2,
    avgSpeedKmph: speed,
    nightSurchargePct: 10,
    nightStartHourIst: 22,
    nightEndHourIst: 6,
    urgentSurchargePct: 15,
    urgentWithinHours: 24,
    gstPct: 12,
    rangeLowPct: 8,
    rangeHighPct: 12,
    roundToPaise: 10_000,
    includes: ["Truck and driver", "Fuel", "Driver allowance"],
    excludes: ["Tolls (paid at actuals)", "Loading and unloading labour", "Waiting beyond 2 hours"],
  }),
);

export const sampleAreas: ServiceArea[] = [
  ["chennai", "Chennai", "Tamil Nadu", 13.0827, 80.2707, 60],
  ["bengaluru", "Bengaluru", "Karnataka", 12.9716, 77.5946, 60],
  ["coimbatore", "Coimbatore", "Tamil Nadu", 11.0168, 76.9558, 40],
  ["madurai", "Madurai", "Tamil Nadu", 9.9252, 78.1198, 40],
  ["hyderabad", "Hyderabad", "Telangana", 17.385, 78.4867, 60],
  ["kochi", "Kochi", "Kerala", 9.9312, 76.2673, 40],
  ["vijayawada", "Vijayawada", "Andhra Pradesh", 16.5062, 80.648, 40],
  ["pune", "Pune", "Maharashtra", 18.5204, 73.8567, 50],
  ["mumbai", "Mumbai", "Maharashtra", 19.076, 72.8777, 60],
].map(([slug, name, state, lat, lng, radiusKm]) => ({
  slug: slug as string,
  name: name as string,
  state: state as string,
  lat: lat as number,
  lng: lng as number,
  radiusKm: radiusKm as number,
  isSample: true,
}));

export const sampleLanes: Lane[] = [
  ["chennai", "bengaluru"],
  ["chennai", "coimbatore"],
  ["chennai", "hyderabad"],
  ["chennai", "madurai"],
  ["bengaluru", "hyderabad"],
  ["bengaluru", "kochi"],
  ["coimbatore", "kochi"],
  ["hyderabad", "vijayawada"],
  ["bengaluru", "pune"],
  ["pune", "mumbai"],
].map(([from, to]) => ({ from: from as string, to: to as string }));

export const sampleFaqs: Faq[] = [
  [
    "What is a full truck load (FTL)?",
    "You book the whole truck for your goods. Nobody else's load shares it, so it goes straight from pickup to drop.",
  ],
  [
    "Do I need to sign up to see a price?",
    "No. Enter pickup, drop and truck type to see a fare range. Leave your number only if you want us to call you.",
  ],
  [
    "How is the fare calculated?",
    "From the road distance, the truck type and the pickup time. Night and same-day pickups can cost more. The estimate lists what is included and what is not.",
  ],
  [
    "Why do I see a range, not one price?",
    "The final fare depends on details we confirm with you, such as exact addresses and loading time. You agree the final fare before anything is booked.",
  ],
  [
    "Who carries my goods?",
    "A transporter from TruckBuck's closed network. Every transporter is checked before they can accept a load. It is not an open load board.",
  ],
  [
    "What happens after I ask for a callback?",
    "Our team calls the number you gave, confirms the details and the fare, and assigns a vetted transporter.",
  ],
  [
    "Can I continue on WhatsApp instead?",
    "Yes. After you see your fare, tap Continue on WhatsApp. The message already includes your route, truck and estimate.",
  ],
  [
    "Which cities do you serve?",
    "See the coverage map on this page. If your route is not listed, leave your number and we will call you if we can help.",
  ],
].map(([question, answer]) => ({ question: question as string, answer: answer as string }));
