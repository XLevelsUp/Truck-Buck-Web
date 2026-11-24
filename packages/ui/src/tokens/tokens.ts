/**
 * TruckBuck design tokens — the single source of truth.
 *
 * This is the ONLY file in the repo allowed to contain raw colour values
 * (enforced by `pnpm lint:colors` and the `no-restricted-syntax` ESLint rule).
 * Everything else uses semantic roles: Tailwind classes (`bg-primary`), CSS
 * variables (`var(--tb-primary)`), or `themes.light.primary` in code that
 * cannot read CSS (OG images, favicons).
 *
 * After editing, run `pnpm --filter @truckbuck/ui tokens` to regenerate
 * `src/styles/tokens.css`. A unit test fails if the CSS is stale, and another
 * fails if any text pair in `contrastPairs` drops below WCAG 2.2 AA.
 *
 * No imports and no TypeScript-only runtime syntax: Node runs this file
 * directly (type stripping) from the generator script.
 */

/* -------------------------------------------------------------------------- */
/* Palette — raw values. Never used directly by components.                    */
/* -------------------------------------------------------------------------- */

export const palette = {
  white: "#FFFFFF",
  /** Brand "road blue". 700 is the logo colour. */
  blue: {
    50: "#EEF2FB",
    100: "#D9E2F6",
    200: "#B5C6EE",
    300: "#8AA4E2",
    400: "#5E80D4",
    500: "#3B5FC4",
    600: "#2A4BB0",
    700: "#1F3A8A",
    800: "#182D6B",
    900: "#12214F",
    950: "#0B1533",
  },
  /** Action amber — CTAs only. Echoes the yellow plate on Indian commercial vehicles. */
  amber: {
    50: "#FFF8EB",
    100: "#FEEFC7",
    200: "#FDDC8A",
    300: "#FCC54D",
    400: "#FBB024",
    500: "#F59E0B",
    600: "#D97706",
    700: "#B45309",
    800: "#92400E",
    900: "#78350F",
    950: "#451A03",
  },
  /** Warm grey — neutrals with a hint of road dust, not cold SaaS slate. */
  grey: {
    25: "#FCFBFA",
    50: "#F7F6F4",
    100: "#EFEDEA",
    200: "#E2DFDA",
    300: "#CBC7C0",
    400: "#A39E96",
    500: "#7A756D",
    600: "#5E5A53",
    700: "#47443F",
    750: "#3A3834",
    800: "#2F2D2A",
    900: "#1E1D1B",
    950: "#131211",
  },
  green: {
    50: "#ECFDF3",
    300: "#86EFAC",
    400: "#4ADE80",
    600: "#15803D",
    700: "#166534",
    950: "#052E16",
  },
  red: {
    50: "#FEF2F2",
    300: "#FCA5A5",
    400: "#F87171",
    600: "#DC2626",
    700: "#B91C1C",
    950: "#450A0A",
  },
  sky: {
    50: "#EFF8FF",
    300: "#7DD3FC",
    400: "#38BDF8",
    600: "#0369A1",
    700: "#075985",
    950: "#082F49",
  },
} as const;

/* -------------------------------------------------------------------------- */
/* Semantic colour roles, per theme.                                          */
/* -------------------------------------------------------------------------- */

export const colorRoles = [
  "background",
  "foreground",
  "surface",
  "surface-foreground",
  "surface-muted",
  "muted-foreground",
  "surface-brand",
  "surface-brand-foreground",
  "border",
  "border-strong",
  "primary",
  "primary-foreground",
  "primary-hover",
  "primary-soft",
  "primary-soft-foreground",
  "accent",
  "accent-foreground",
  "accent-hover",
  "accent-border",
  "link",
  "ring",
  "success",
  "success-foreground",
  "success-soft",
  "success-soft-foreground",
  "warning",
  "warning-foreground",
  "warning-soft",
  "warning-soft-foreground",
  "danger",
  "danger-foreground",
  "danger-soft",
  "danger-soft-foreground",
  "info",
  "info-foreground",
  "info-soft",
  "info-soft-foreground",
  "overlay",
  // The logo keeps its brand colours in both themes; only the wordmark inverts.
  "logo-tile",
  "logo-monogram",
  "logo-lane",
  "logo-wordmark",
  // Truck illustrations: brand colours in both themes (like the logo), so a
  // truck looks the same on light and dark pages. Decorative, no text on them.
  "illo-cab",
  "illo-cab-shade",
  "illo-cab-top",
  "illo-body",
  "illo-body-shade",
  "illo-body-top",
  "illo-cargo",
  "illo-cargo-shade",
  "illo-chassis",
  "illo-glass",
  "illo-tyre",
  "illo-hub",
  "illo-plate",
  "illo-cold",
  "illo-shadow",
] as const;

export type ColorRole = (typeof colorRoles)[number];
export type ThemeName = "light" | "dark";

const { white, blue, amber, grey, green, red, sky } = palette;

export const themes: Record<ThemeName, Record<ColorRole, string>> = {
  light: {
    background: grey[25],
    foreground: grey[900],
    surface: white,
    "surface-foreground": grey[900],
    "surface-muted": grey[50],
    "muted-foreground": grey[600],
    "surface-brand": blue[700],
    "surface-brand-foreground": white,
    border: grey[200],
    "border-strong": grey[500],
    primary: blue[700],
    "primary-foreground": white,
    "primary-hover": blue[800],
    "primary-soft": blue[50],
    "primary-soft-foreground": blue[700],
    accent: amber[500],
    "accent-foreground": grey[900],
    "accent-hover": amber[400],
    "accent-border": amber[600],
    link: blue[700],
    ring: blue[500],
    success: green[600],
    "success-foreground": white,
    "success-soft": green[50],
    "success-soft-foreground": green[700],
    warning: amber[700],
    "warning-foreground": white,
    "warning-soft": amber[50],
    "warning-soft-foreground": amber[800],
    danger: red[600],
    "danger-foreground": white,
    "danger-soft": red[50],
    "danger-soft-foreground": red[700],
    info: sky[600],
    "info-foreground": white,
    "info-soft": sky[50],
    "info-soft-foreground": sky[700],
    overlay: "#13121199",
    "logo-tile": blue[700],
    "logo-monogram": white,
    "logo-lane": amber[500],
    "logo-wordmark": grey[900],
    "illo-cab": blue[700],
    "illo-cab-shade": blue[800],
    "illo-cab-top": blue[500],
    "illo-body": white,
    "illo-body-shade": grey[200],
    "illo-body-top": grey[100],
    "illo-cargo": amber[300],
    "illo-cargo-shade": amber[600],
    "illo-chassis": grey[700],
    "illo-glass": blue[200],
    "illo-tyre": grey[900],
    "illo-hub": grey[400],
    "illo-plate": amber[500],
    "illo-cold": sky[400],
    "illo-shadow": "#1312112E",
  },
  dark: {
    background: grey[950],
    foreground: grey[50],
    surface: grey[900],
    "surface-foreground": grey[50],
    "surface-muted": grey[800],
    "muted-foreground": grey[300],
    "surface-brand": blue[900],
    "surface-brand-foreground": grey[50],
    border: grey[750],
    "border-strong": grey[500],
    primary: blue[300],
    "primary-foreground": blue[950],
    "primary-hover": blue[200],
    "primary-soft": blue[900],
    "primary-soft-foreground": blue[200],
    accent: amber[400],
    "accent-foreground": grey[950],
    "accent-hover": amber[300],
    "accent-border": amber[400],
    link: blue[300],
    ring: blue[300],
    success: green[400],
    "success-foreground": green[950],
    "success-soft": green[950],
    "success-soft-foreground": green[300],
    warning: amber[400],
    "warning-foreground": grey[950],
    "warning-soft": amber[950],
    "warning-soft-foreground": amber[300],
    danger: red[400],
    "danger-foreground": red[950],
    "danger-soft": red[950],
    "danger-soft-foreground": red[300],
    info: sky[400],
    "info-foreground": sky[950],
    "info-soft": sky[950],
    "info-soft-foreground": sky[300],
    overlay: "#000000B3",
    "logo-tile": blue[700],
    "logo-monogram": white,
    "logo-lane": amber[500],
    "logo-wordmark": grey[50],
    "illo-cab": blue[700],
    "illo-cab-shade": blue[800],
    "illo-cab-top": blue[500],
    "illo-body": grey[100],
    "illo-body-shade": grey[300],
    "illo-body-top": grey[50],
    "illo-cargo": amber[300],
    "illo-cargo-shade": amber[600],
    "illo-chassis": grey[600],
    "illo-glass": blue[200],
    "illo-tyre": grey[950],
    "illo-hub": grey[400],
    "illo-plate": amber[500],
    "illo-cold": sky[400],
    "illo-shadow": "#00000066",
  },
};

/**
 * Pairs that must meet WCAG 2.2 AA in BOTH themes. `min` is 4.5 for text
 * (1.4.3) and 3 for non-text UI such as input borders and focus rings (1.4.11).
 * Checked by `tokens.test.ts`; shown with live ratios on /styleguide.
 */
export const contrastPairs: readonly { fg: ColorRole; bg: ColorRole; min: 3 | 4.5 }[] = [
  // Body and secondary text on every surface.
  { fg: "foreground", bg: "background", min: 4.5 },
  { fg: "surface-foreground", bg: "surface", min: 4.5 },
  { fg: "foreground", bg: "surface-muted", min: 4.5 },
  { fg: "muted-foreground", bg: "background", min: 4.5 },
  { fg: "muted-foreground", bg: "surface", min: 4.5 },
  { fg: "muted-foreground", bg: "surface-muted", min: 4.5 },
  { fg: "link", bg: "background", min: 4.5 },
  { fg: "link", bg: "surface", min: 4.5 },
  { fg: "link", bg: "surface-muted", min: 4.5 },
  { fg: "surface-brand-foreground", bg: "surface-brand", min: 4.5 },
  // Filled components.
  { fg: "primary-foreground", bg: "primary", min: 4.5 },
  { fg: "primary-foreground", bg: "primary-hover", min: 4.5 },
  { fg: "primary-soft-foreground", bg: "primary-soft", min: 4.5 },
  { fg: "accent-foreground", bg: "accent", min: 4.5 },
  { fg: "accent-foreground", bg: "accent-hover", min: 4.5 },
  { fg: "success-foreground", bg: "success", min: 4.5 },
  { fg: "success-soft-foreground", bg: "success-soft", min: 4.5 },
  { fg: "warning-foreground", bg: "warning", min: 4.5 },
  { fg: "warning-soft-foreground", bg: "warning-soft", min: 4.5 },
  { fg: "danger-foreground", bg: "danger", min: 4.5 },
  { fg: "danger-soft-foreground", bg: "danger-soft", min: 4.5 },
  { fg: "info-foreground", bg: "info", min: 4.5 },
  { fg: "info-soft-foreground", bg: "info-soft", min: 4.5 },
  // Status colours used as text (error messages, inline status).
  { fg: "success", bg: "surface", min: 4.5 },
  { fg: "warning", bg: "surface", min: 4.5 },
  { fg: "danger", bg: "surface", min: 4.5 },
  { fg: "danger", bg: "background", min: 4.5 },
  { fg: "info", bg: "surface", min: 4.5 },
  // Non-text UI (WCAG 1.4.11).
  { fg: "border-strong", bg: "background", min: 3 },
  { fg: "border-strong", bg: "surface", min: 3 },
  { fg: "ring", bg: "background", min: 3 },
  { fg: "ring", bg: "surface", min: 3 },
  { fg: "accent-border", bg: "background", min: 3 },
  { fg: "accent-border", bg: "surface", min: 3 },
  { fg: "accent", bg: "surface-brand", min: 3 },
  { fg: "primary", bg: "background", min: 3 },
  // Logo legibility.
  { fg: "logo-monogram", bg: "logo-tile", min: 4.5 },
  { fg: "logo-lane", bg: "logo-tile", min: 3 },
  { fg: "logo-wordmark", bg: "background", min: 4.5 },
];

/* -------------------------------------------------------------------------- */
/* Typography                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * One variable sans (Geist) for everything, with Noto fallbacks so Hindi and
 * Tamil render in a matching humanist sans. Apps load the faces (next/font in
 * marketing) and set `--tb-font-sans-face` / `--tb-font-devanagari` /
 * `--tb-font-tamil`; the stack below falls back to system fonts otherwise.
 * No separate display face: Geist's 700–800 weights carry headlines, and a
 * second family would cost ~30 KB on the LCP path.
 */
export const fontFamilies = {
  sans: [
    "var(--tb-font-sans-face, ui-sans-serif)",
    "var(--tb-font-devanagari, 'Noto Sans Devanagari')",
    "var(--tb-font-tamil, 'Noto Sans Tamil')",
    "system-ui",
    "-apple-system",
    "'Segoe UI'",
    "Roboto",
    "sans-serif",
  ],
  mono: ["ui-monospace", "'SFMono-Regular'", "Menlo", "Consolas", "monospace"],
} as const;

/**
 * Fluid type scale. Sizes interpolate between a 360px and a 1280px viewport
 * with clamp(); body sizes stay fixed so form text never drops below 16px
 * (which also stops iOS zooming into focused inputs).
 */
export const typeScale = {
  xs: { size: "0.75rem", lineHeight: "1rem", tracking: "0.01em" },
  sm: { size: "0.875rem", lineHeight: "1.25rem", tracking: "0" },
  base: { size: "1rem", lineHeight: "1.5rem", tracking: "0" },
  lg: {
    size: "clamp(1.0625rem, 1.0136rem + 0.2174vw, 1.125rem)",
    lineHeight: "1.6",
    tracking: "0",
  },
  xl: {
    size: "clamp(1.125rem, 1.0272rem + 0.4348vw, 1.25rem)",
    lineHeight: "1.5",
    tracking: "-0.005em",
  },
  "2xl": {
    size: "clamp(1.25rem, 1.0543rem + 0.8696vw, 1.5rem)",
    lineHeight: "1.35",
    tracking: "-0.01em",
  },
  "3xl": {
    size: "clamp(1.5rem, 1.2065rem + 1.3043vw, 1.875rem)",
    lineHeight: "1.25",
    tracking: "-0.015em",
  },
  "4xl": {
    size: "clamp(1.75rem, 1.3587rem + 1.7391vw, 2.25rem)",
    lineHeight: "1.2",
    tracking: "-0.02em",
  },
  "5xl": {
    size: "clamp(2rem, 1.2174rem + 3.4783vw, 3rem)",
    lineHeight: "1.1",
    tracking: "-0.025em",
  },
  display: {
    size: "clamp(2.25rem, 1.0761rem + 5.2174vw, 3.75rem)",
    lineHeight: "1.05",
    tracking: "-0.03em",
  },
} as const;

export const fontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;

/* -------------------------------------------------------------------------- */
/* Space, shape, depth, motion, layering, layout                              */
/* -------------------------------------------------------------------------- */

/** 4px grid: Tailwind's `p-1` = 4px, `p-4` = 16px, and so on. */
export const spacingBase = "0.25rem";

export const radii = {
  xs: "0.125rem",
  sm: "0.25rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "0.75rem",
  "2xl": "1rem",
  "3xl": "1.5rem",
} as const;

/** Elevation: shadows are tinted with warm grey, never pure black. */
export const shadows: Record<ThemeName, Record<"xs" | "sm" | "md" | "lg" | "xl", string>> = {
  light: {
    xs: "0 1px 2px 0 rgb(19 18 17 / 0.06)",
    sm: "0 1px 3px 0 rgb(19 18 17 / 0.08), 0 1px 2px -1px rgb(19 18 17 / 0.08)",
    md: "0 4px 8px -2px rgb(19 18 17 / 0.08), 0 2px 4px -2px rgb(19 18 17 / 0.06)",
    lg: "0 12px 20px -4px rgb(19 18 17 / 0.10), 0 4px 8px -4px rgb(19 18 17 / 0.06)",
    xl: "0 24px 40px -8px rgb(19 18 17 / 0.16), 0 8px 16px -8px rgb(19 18 17 / 0.08)",
  },
  dark: {
    xs: "0 1px 2px 0 rgb(0 0 0 / 0.40)",
    sm: "0 1px 3px 0 rgb(0 0 0 / 0.45), 0 1px 2px -1px rgb(0 0 0 / 0.45)",
    md: "0 4px 8px -2px rgb(0 0 0 / 0.50), 0 2px 4px -2px rgb(0 0 0 / 0.40)",
    lg: "0 12px 20px -4px rgb(0 0 0 / 0.55), 0 4px 8px -4px rgb(0 0 0 / 0.40)",
    xl: "0 24px 40px -8px rgb(0 0 0 / 0.60), 0 8px 16px -8px rgb(0 0 0 / 0.45)",
  },
};

export const motion = {
  duration: { instant: "0ms", fast: "120ms", base: "200ms", slow: "320ms" },
  easing: {
    /** Most UI transitions. */
    standard: "cubic-bezier(0.2, 0, 0, 1)",
    /** Elements entering the screen. */
    enter: "cubic-bezier(0, 0, 0, 1)",
    /** Elements leaving the screen. */
    exit: "cubic-bezier(0.3, 0, 1, 1)",
  },
} as const;

/** Named layers. Use the `z-<name>` utilities, never raw numbers. */
export const zIndex = {
  base: 0,
  raised: 10,
  sticky: 20,
  "bottom-bar": 30,
  overlay: 40,
  modal: 50,
  popover: 60,
  toast: 70,
  "skip-link": 80,
} as const;

/** Mobile-first breakpoints. 360px is the design baseline (no media query needed). */
export const breakpoints = {
  xs: "22.5rem",
  md: "48rem",
  lg: "64rem",
  xl: "80rem",
  "2xl": "96rem",
} as const;

export const layout = {
  /** Max width of page content. */
  content: "76rem",
  /** Comfortable reading measure. */
  prose: "68ch",
  /** Minimum touch target (exceeds WCAG 2.2's 24px). */
  touchTarget: "2.75rem",
} as const;
