import { ImageResponse } from "next/og";

import { iconSvg } from "@truckbuck/ui/brand/logo-geometry";
import { themes } from "@truckbuck/ui/tokens";
import {
  type IlloRole,
  TruckIllustration,
  type TruckIllustrationKind,
} from "@truckbuck/ui/truck-illustration";

import { env } from "@/env";
import { brandColors, brandTheme } from "@/lib/brand";

export const ogSize = { width: 1200, height: 630 };

/** Illustration colours resolved from the light theme (Satori has no CSS variables). */
const illoColors = Object.fromEntries(
  (Object.keys(themes.light) as (keyof typeof themes.light)[])
    .filter((role) => role.startsWith("illo-"))
    .map((role) => [role, themes.light[role]]),
) as Record<IlloRole, string>;

export interface OgImageOptions {
  /** Main line, ≤ 60 characters (it wraps to two lines at most). */
  title: string;
  /** Small line above the title, e.g. "For transporters". */
  eyebrow?: string;
  /** Domain or short URL shown bottom-left. */
  footer: string;
  /** Truck class drawn on the right; omit for a text-only card. */
  truck?: TruckIllustrationKind;
}

/**
 * The branded share-image template (WhatsApp, LinkedIn, X previews). Every
 * route's `opengraph-image.tsx` calls this with its own title, so previews
 * stay consistent: brand-blue field, white headline, amber lane dashes, and
 * optionally the page's truck illustration on a light panel.
 *
 * Latin text only: the bundled OG font has no Devanagari or Tamil glyphs, so
 * /hi and /ta pages use the English card until those fonts are added.
 */
export function ogImage({ title, eyebrow, footer, truck }: OgImageOptions): ImageResponse {
  const mark = `data:image/svg+xml;utf8,${encodeURIComponent(iconSvg(brandColors.onDark))}`;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: brandTheme.surfaceBrand,
        color: brandTheme.onBrand,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          flex: 1,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img>. */}
        <img src={mark} width={96} height={96} alt="" style={{ borderRadius: 20 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {eyebrow ? (
            <div style={{ fontSize: 34, color: brandTheme.accent, fontWeight: 600 }}>{eyebrow}</div>
          ) : null}
          <div
            style={{
              fontSize: truck ? 64 : 76,
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: -2,
            }}
          >
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
      </div>
      {truck ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 460,
            margin: "72px 72px 72px 0",
            borderRadius: 32,
            background: brandTheme.muted,
          }}
        >
          <TruckIllustration kind={truck} colors={illoColors} width={420} height={315} />
        </div>
      ) : null}
    </div>,
    ogSize,
  );
}

/** A page's share image: its title, an eyebrow and an optional truck, with the site host as footer. */
export function pageOgImage(options: Omit<OgImageOptions, "footer">): ImageResponse {
  return ogImage({ ...options, footer: new URL(env.NEXT_PUBLIC_SITE_URL).host });
}
