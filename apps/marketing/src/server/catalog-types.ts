/** Shapes the site renders. Safe to pass to Client Components (no rates). */

export type TruckIconKey =
  "mini" | "pickup" | "lcv" | "mcv" | "container" | "open" | "trailer" | "reefer";

export interface TruckType {
  slug: string;
  name: string;
  bodyType: string;
  iconKey: TruckIconKey;
  lengthFt: number;
  payloadTonnes: number;
  goodFor: string | null;
  /** Catalogue class used by the truck advisor (mini, lcv, mcv, hcv, container…). */
  truckClass: string;
  widthFt: number | null;
  heightFt: number | null;
  /** Approx. standard 1200×1000 mm pallets, single stacked. */
  pallets: number | null;
  typicalLoads: string[];
  /** 4:3 photo or render; null = show the class icon. */
  imageUrl: string | null;
  imageAlt: string | null;
  isSample: boolean;
}

export interface ServiceArea {
  slug: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  radiusKm: number;
  isSample: boolean;
}

export interface Lane {
  from: string;
  to: string;
}

export interface Faq {
  question: string;
  answer: string;
}

export interface TestimonialRecord {
  quote: string;
  name: string;
  role: string | null;
  company: string | null;
}

/** A real count from the booking system (site_metrics), already above its threshold. */
export interface SiteMetric {
  key: "trips_completed" | "transporters_onboarded";
  value: number;
  measuredAt: string;
}

export interface ClientLogoRecord {
  name: string;
  logoUrl: string;
}

export interface Catalog {
  trucks: TruckType[];
  areas: ServiceArea[];
  lanes: Lane[];
  /** True when any of the above is sample data (dev/preview). */
  usesSampleData: boolean;
}
