/**
 * TruckBuck logo geometry, shared by the React <Logo> and the static SVG /
 * PNG assets (favicons, OG image, downloadable brand files). Pure data, no
 * imports: Node runs it directly from the asset generator.
 *
 * The mark: a rounded "road blue" tile, a geometric white TB monogram, and
 * three amber lane dashes — the road the trucks run on.
 * The wordmark: drawn from the same stroke system (not a font), so it
 * renders identically everywhere and needs no font licence.
 */

export const MARK_SIZE = 64;
export const MARK_RADIUS = 14;

/** Monogram strokes (white), 64×64 space, stroke width 5, butt caps. */
export const markMonogram = {
  strokeWidth: 5,
  paths: [
    // T
    "M11 15.5h20",
    "M21 13v30",
    // B
    "M36.5 13v30",
    "M36.5 15.5H43a6 6 0 0 1 0 12H36.5",
    "M43 27.5h1a6.5 6.5 0 0 1 0 13H36.5",
  ],
} as const;

/** Lane dashes (amber), stroke width 4, butt caps. */
export const markLane = {
  strokeWidth: 4,
  path: "M11 51.5h10M27 51.5h10M43 51.5h10",
} as const;

/**
 * Wordmark "TruckBuck": stroke 4, butt caps. Cap height 24 (y 16–40),
 * x-height 17 (y 23–40). Each glyph is drawn at x=0 and placed with `x`.
 */
export const WORDMARK_STROKE = 4;
export const WORDMARK_WIDTH = 150;
/** Vertical extent of the glyphs inside the wordmark coordinate space. */
export const WORDMARK_TOP = 16;
export const WORDMARK_BOTTOM = 40;

const glyphs = {
  T: "M0 18h16M8 16v24",
  r: "M2 23v17M2 31a6 6 0 0 1 6-6h3",
  u: "M2 23v9.5a5.5 5.5 0 0 0 11 0M13 23v17",
  c: "M13.1 26.9A6.5 6.5 0 1 0 13.1 36.1",
  k: "M2 16v24M13 23.5 4 31.5M7.2 28.8 13.6 40",
  B: "M2 16v24M2 18h6.5a5 5 0 0 1 0 10H2M8.5 28h1a5 5 0 0 1 0 10H2",
} as const;

export const wordmarkGlyphs: readonly { d: string; x: number }[] = [
  { d: glyphs.T, x: 0 },
  { d: glyphs.r, x: 18.5 },
  { d: glyphs.u, x: 32 },
  { d: glyphs.c, x: 49 },
  { d: glyphs.k, x: 65 },
  { d: glyphs.B, x: 83 },
  { d: glyphs.u, x: 102 },
  { d: glyphs.c, x: 119 },
  { d: glyphs.k, x: 135 },
];

export interface LogoColors {
  tile: string;
  monogram: string;
  lane: string;
  wordmark: string;
}

function markGroup(colors: LogoColors, transform = ""): string {
  const t = transform ? ` transform="${transform}"` : "";
  return [
    `<g${t}>`,
    `<rect width="${MARK_SIZE}" height="${MARK_SIZE}" rx="${MARK_RADIUS}" fill="${colors.tile}"/>`,
    `<path d="${markMonogram.paths.join("")}" fill="none" stroke="${colors.monogram}" stroke-width="${markMonogram.strokeWidth}"/>`,
    `<path d="${markLane.path}" fill="none" stroke="${colors.lane}" stroke-width="${markLane.strokeWidth}"/>`,
    `</g>`,
  ].join("");
}

function wordmarkGroup(colors: LogoColors, transform: string): string {
  const glyphPaths = wordmarkGlyphs
    .map((g) => `<path transform="translate(${g.x} 0)" d="${g.d}"/>`)
    .join("");
  return `<g transform="${transform}" fill="none" stroke="${colors.wordmark}" stroke-width="${WORDMARK_STROKE}">${glyphPaths}</g>`;
}

const svgOpen = (w: number, h: number, title: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * 4}" height="${h * 4}" role="img" aria-label="${title}"><title>${title}</title>`;

/**
 * App-icon SVG (square). `bleed` fills the whole square with the tile colour
 * and scales the mark into the centre — for apple-touch (iOS rounds it) and
 * maskable PWA icons (content must sit inside the central 80% safe zone).
 */
export function iconSvg(colors: LogoColors, options: { bleed?: boolean; scale?: number } = {}) {
  const { bleed = false, scale = 1 } = options;
  const offset = (MARK_SIZE * (1 - scale)) / 2;
  const inner = `<g transform="translate(${offset} ${offset}) scale(${scale})"><path d="${markMonogram.paths.join("")}" fill="none" stroke="${colors.monogram}" stroke-width="${markMonogram.strokeWidth}"/><path d="${markLane.path}" fill="none" stroke="${colors.lane}" stroke-width="${markLane.strokeWidth}"/></g>`;
  const tile = `<rect width="${MARK_SIZE}" height="${MARK_SIZE}"${bleed ? "" : ` rx="${MARK_RADIUS}"`} fill="${colors.tile}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MARK_SIZE} ${MARK_SIZE}">${tile}${inner}</svg>`;
}

/** Standalone SVG strings for the downloadable brand files. */
export function logoSvg(
  layout: "mark" | "horizontal" | "stacked",
  colors: LogoColors,
  title = "TruckBuck",
): string {
  if (layout === "mark") {
    return `${svgOpen(MARK_SIZE, MARK_SIZE, title)}${markGroup(colors)}</svg>`;
  }
  if (layout === "horizontal") {
    // Mark scaled to 40px; wordmark cap height (24) centred on it.
    const width = 40 + 12 + WORDMARK_WIDTH;
    return `${svgOpen(width, 40, title)}${markGroup(colors, "scale(0.625)")}${wordmarkGroup(colors, "translate(52 -8)")}</svg>`;
  }
  const width = WORDMARK_WIDTH;
  return `${svgOpen(width, 104, title)}${markGroup(colors, `translate(${(width - MARK_SIZE) / 2} 0)`)}${wordmarkGroup(colors, "translate(0 62)")}</svg>`;
}
