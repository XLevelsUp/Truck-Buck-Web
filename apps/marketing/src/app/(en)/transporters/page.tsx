import type { Metadata } from "next";

import { transportersMetadata, TransportersPage } from "@/components/pages/transporters-page";

export const metadata: Metadata = transportersMetadata("en");

export default function Page() {
  return <TransportersPage locale="en" />;
}
