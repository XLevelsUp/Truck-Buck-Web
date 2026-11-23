import { ImageResponse } from "next/og";

import { iconSvg, logoSvg } from "@truckbuck/ui/brand/logo-geometry";

import { brandColors } from "@/lib/brand";

/**
 * Brand assets generated at build time from the logo geometry and design
 * tokens (one source of truth; no hand-exported files to drift):
 *
 *   /brand/truckbuck-{mark,horizontal,stacked}.svg            on light
 *   /brand/truckbuck-{horizontal,stacked}-reversed.svg        on dark / photos
 *   /brand/favicon.svg, icon-32.png                            browser tab
 *   /brand/apple-touch-icon.png                                iOS home screen
 *   /brand/icon-192.png, icon-512.png, icon-maskable-512.png   PWA manifest
 */

const light = brandColors.onLight;
const dark = brandColors.onDark;

const svgAssets: Record<string, () => string> = {
  "truckbuck-mark.svg": () => logoSvg("mark", light),
  "truckbuck-horizontal.svg": () => logoSvg("horizontal", light),
  "truckbuck-horizontal-reversed.svg": () => logoSvg("horizontal", dark),
  "truckbuck-stacked.svg": () => logoSvg("stacked", light),
  "truckbuck-stacked-reversed.svg": () => logoSvg("stacked", dark),
  "favicon.svg": () => iconSvg(light),
};

const pngAssets: Record<string, { size: number; svg: () => string }> = {
  "icon-32.png": { size: 32, svg: () => iconSvg(light) },
  // iOS applies its own corner mask: fill edge to edge.
  "apple-touch-icon.png": { size: 180, svg: () => iconSvg(light, { bleed: true, scale: 0.8 }) },
  "icon-192.png": { size: 192, svg: () => iconSvg(light) },
  "icon-512.png": { size: 512, svg: () => iconSvg(light) },
  // Maskable: content inside the central 80% safe zone.
  "icon-maskable-512.png": { size: 512, svg: () => iconSvg(light, { bleed: true, scale: 0.7 }) },
};

export function generateStaticParams() {
  return [...Object.keys(svgAssets), ...Object.keys(pngAssets)].map((asset) => ({ asset }));
}

const immutable = "public, max-age=31536000, immutable";

export async function GET(_request: Request, { params }: RouteContext<"/brand/[asset]">) {
  const { asset } = await params;

  const svg = svgAssets[asset];
  if (svg) {
    return new Response(svg(), {
      headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": immutable },
    });
  }

  const png = pngAssets[asset];
  if (png) {
    const src = `data:image/svg+xml;utf8,${encodeURIComponent(png.svg())}`;
    return new ImageResponse(
      // eslint-disable-next-line @next/next/no-img-element -- ImageResponse (Satori) renders plain <img>; next/image doesn't apply here.
      <img src={src} width={png.size} height={png.size} alt="" />,
      { width: png.size, height: png.size, headers: { "Cache-Control": immutable } },
    );
  }

  return new Response("Not found", { status: 404 });
}
