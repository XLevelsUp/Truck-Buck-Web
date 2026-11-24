import { Geist, Noto_Sans_Devanagari, Noto_Sans_Tamil } from "next/font/google";

/*
 * Fonts shared by both root layouts ((en) and [locale]). Geist is preloaded
 * on every page. The Noto faces are not preloaded: each @font-face carries a
 * unicode-range, so a browser only downloads them on pages that use Hindi
 * or Tamil script (the /hi and /ta pages).
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const notoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari"],
  display: "swap",
  preload: false,
});

const notoTamil = Noto_Sans_Tamil({
  variable: "--font-noto-tamil",
  subsets: ["tamil"],
  display: "swap",
  preload: false,
});

export const fontVariables = `${geistSans.variable} ${notoDevanagari.variable} ${notoTamil.variable}`;
