import type { Metadata } from "next";

import { shippersMetadata, ShippersPage } from "@/components/pages/shippers-page";

export const metadata: Metadata = shippersMetadata();

export default function Page() {
  return <ShippersPage />;
}
