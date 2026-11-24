import type { Metadata } from "next";

import { driversMetadata, DriversPage } from "@/components/pages/drivers-page";

export const metadata: Metadata = driversMetadata("en");

export default function Page() {
  return <DriversPage locale="en" />;
}
