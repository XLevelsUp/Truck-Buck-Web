import { type LogoColors } from "@truckbuck/ui/brand/logo-geometry";
import { themes } from "@truckbuck/ui/tokens";

/**
 * Colours for brand assets rendered outside CSS (SVG files, PNG icons, OG
 * images), read from the design tokens so nothing here is a raw value.
 */
export const brandColors = {
  onLight: {
    tile: themes.light["logo-tile"],
    monogram: themes.light["logo-monogram"],
    lane: themes.light["logo-lane"],
    wordmark: themes.light["logo-wordmark"],
  },
  /** Reversed lockup for dark or photographic backgrounds. */
  onDark: {
    tile: themes.dark["logo-tile"],
    monogram: themes.dark["logo-monogram"],
    lane: themes.dark["logo-lane"],
    wordmark: themes.dark["logo-wordmark"],
  },
} satisfies Record<string, LogoColors>;

export const brandTheme = {
  /** Browser UI tint (address bar on Android). */
  themeColor: themes.light["logo-tile"],
  background: themes.light.background,
  surfaceBrand: themes.light["surface-brand"],
  onBrand: themes.light["surface-brand-foreground"],
  accent: themes.light.accent,
  onAccent: themes.light["accent-foreground"],
  muted: themes.light["primary-soft"],
} as const;
