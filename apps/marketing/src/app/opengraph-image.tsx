import { ImageResponse } from "next/og";

import { getContent } from "@/content";

export const alt = getContent().site.tagline;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default social share image, generated at build time. */
export default function OpenGraphImage() {
  const { site } = getContent();
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 80,
        background: "#1f3a8a",
        color: "#ffffff",
      }}
    >
      <div style={{ fontSize: 88, fontWeight: 700, color: "#fbbf24" }}>{site.name}</div>
      <div style={{ fontSize: 44, marginTop: 24 }}>{site.tagline}</div>
    </div>,
    size,
  );
}
