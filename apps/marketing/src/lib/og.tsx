import { ImageResponse } from "next/og";

import { iconSvg } from "@truckbuck/ui/brand/logo-geometry";

import { brandColors, brandTheme } from "@/lib/brand";

export const ogSize = { width: 1200, height: 630 };

export interface OgImageOptions {
  /** Main line, ≤ 60 characters (it wraps to two lines at most). */
  title: string;
  /** Small line above the title, e.g. "For transporters". */
  eyebrow?: string;
  /** Domain or short URL shown bottom-left. */
  footer: string;
}

/**
 * The branded share-image template (WhatsApp, LinkedIn, X previews). Every
 * route's `opengraph-image.tsx` calls this with its own title, so previews
 * stay consistent: brand-blue field, white headline, amber lane dashes.
 */
export function ogImage({ title, eyebrow, footer }: OgImageOptions): ImageResponse {
  const mark = `data:image/svg+xml;utf8,${encodeURIComponent(iconSvg(brandColors.onDark))}`;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: brandTheme.surfaceBrand,
        color: brandTheme.onBrand,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img>. */}
      <img src={mark} width={96} height={96} alt="" style={{ borderRadius: 20 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {eyebrow ? (
          <div style={{ fontSize: 34, color: brandTheme.accent, fontWeight: 600 }}>{eyebrow}</div>
        ) : null}
        <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.08, letterSpacing: -2 }}>
          {title}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 30, opacity: 0.9 }}>{footer}</div>
        <div style={{ display: "flex", gap: 18 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{ width: 72, height: 12, borderRadius: 2, background: brandTheme.accent }}
            />
          ))}
        </div>
      </div>
    </div>,
    ogSize,
  );
}
