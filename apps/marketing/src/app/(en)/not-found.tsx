import type { Metadata } from "next";

import { NotFoundContent } from "@/components/not-found-content";
import { getContent } from "@/content";

const { notFound } = getContent();

export const metadata: Metadata = {
  title: notFound.title,
  robots: { index: false },
};

export default function NotFound() {
  return <NotFoundContent />;
}
