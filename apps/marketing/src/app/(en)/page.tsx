import type { Metadata } from "next";

import { homeMetadata, HomePage } from "@/components/pages/home-page";

export const metadata: Metadata = homeMetadata("en");

export default function Page() {
  return <HomePage locale="en" />;
}
