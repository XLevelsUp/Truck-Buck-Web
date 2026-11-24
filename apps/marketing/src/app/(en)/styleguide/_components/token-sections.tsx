import { contrastRatio, formatRatio } from "@truckbuck/ui/contrast";
import {
  breakpoints,
  colorRoles,
  contrastPairs,
  fontWeights,
  motion,
  palette,
  radii,
  shadows,
  themes,
  typeScale,
  zIndex,
} from "@truckbuck/ui/tokens";

import { Code, Demo, Section } from "./layout";

const roleGroups: { title: string; match: (role: string) => boolean }[] = [
  {
    title: "Surfaces and text",
    match: (r) => /^(background|foreground|surface|muted|border)/.test(r),
  },
  { title: "Brand and action", match: (r) => /^(primary|accent|link|ring)/.test(r) },
  { title: "Status", match: (r) => /^(success|warning|danger|info)/.test(r) },
  { title: "Overlay and logo", match: (r) => /^(overlay|logo)/.test(r) },
];

function Swatch({ role }: { role: string }) {
  return (
    <li className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden="true"
        className="size-12 shrink-0 rounded-lg border border-border-strong"
        style={{ background: `var(--color-${role})` }}
      />
      <span className="grid min-w-0 text-sm">
        <span className="truncate font-semibold">{role}</span>
        <span className="font-mono text-muted-foreground">
          {themes.light[role as keyof typeof themes.light]} ·{" "}
          {themes.dark[role as keyof typeof themes.dark]}
        </span>
      </span>
    </li>
  );
}

export function ColorSection() {
  return (
    <Section
      id="color"
      title="Colour"
      description="Components only use semantic roles. Swatches render the current theme; values are listed light · dark. Raw hex values exist only in packages/ui/src/tokens/tokens.ts."
    >
      {roleGroups.map((group) => (
        <Demo key={group.title} title={group.title}>
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {colorRoles.filter(group.match).map((role) => (
              <Swatch key={role} role={role} />
            ))}
          </ul>
        </Demo>
      ))}

      <Demo title="Palette" note="Raw scales behind the roles. Not for direct use in components.">
        <div className="grid gap-6">
          {(["blue", "amber", "grey", "green", "red", "sky"] as const).map((scale) => (
            <div key={scale} className="grid gap-2">
              <h4 className="font-semibold capitalize">{scale}</h4>
              <ul className="grid grid-cols-4 gap-2 md:grid-cols-7 xl:grid-cols-13">
                {Object.entries(palette[scale]).map(([step, hex]) => (
                  <li key={step} className="grid gap-1 text-xs">
                    <span
                      aria-hidden="true"
                      className="h-10 rounded-md border border-border"
                      style={{ background: hex }}
                    />
                    <span className="font-semibold">{step}</span>
                    <span className="font-mono text-muted-foreground">{hex}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Demo>

      <Demo
        title="Contrast checks"
        note="Every pair below is enforced by a unit test in both themes: 4.5:1 for text, 3:1 for borders, focus rings and other non-text UI (WCAG 2.2 AA)."
      >
        <ul className="grid gap-2 md:grid-cols-2">
          {contrastPairs.map(({ fg, bg, min }) => {
            const light = contrastRatio(themes.light[fg], themes.light[bg]);
            const dark = contrastRatio(themes.dark[fg], themes.dark[bg]);
            return (
              <li
                key={`${fg}-${bg}`}
                className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg bg-surface-muted px-3 py-2 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="grid size-8 shrink-0 place-items-center rounded-md border"
                    style={{ background: `var(--color-${bg})` }}
                  >
                    <span
                      className="h-2.5 w-4 rounded-xs"
                      style={{ background: `var(--color-${fg})` }}
                    />
                  </span>
                  <span className="min-w-0 break-words">
                    {fg} on {bg}
                  </span>
                </span>
                <span className="shrink-0 font-mono tabular-nums">
                  {formatRatio(light)} · {formatRatio(dark)}{" "}
                  <span className="text-muted-foreground">(min {min})</span>
                </span>
              </li>
            );
          })}
        </ul>
      </Demo>
    </Section>
  );
}

const scripts = [
  { lang: "en-IN", label: "English", text: "Book a truck like you book a cab." },
  {
    lang: "hi",
    label: "Hindi (sample, needs native review)",
    text: "ट्रक ऐसे बुक करें, जैसे कैब बुक करते हैं।",
  },
  {
    lang: "ta",
    label: "Tamil (sample, needs native review)",
    text: "கேப் புக் செய்வது போல லாரியை புக் செய்யுங்கள்.",
  },
] as const;

export function TypographySection() {
  const sizes = Object.entries(typeScale).reverse();
  return (
    <Section
      id="type"
      title="Typography"
      description="Geist (variable) for everything, with Noto Sans Devanagari and Noto Sans Tamil as script fallbacks, loaded only when those characters appear. Sizes from lg up are fluid between 360px and 1280px."
    >
      <Demo title="Type scale">
        <ul className="grid gap-6">
          {sizes.map(([name, t]) => (
            <li key={name} className="grid gap-1 border-b pb-4 last:border-b-0 last:pb-0">
              <span className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <Code>text-{name}</Code>
                <span className="font-mono">{t.size}</span>
              </span>
              <span className={`${textClass[name] ?? ""} font-bold break-words`}>
                Chennai to Bengaluru, 32 ft container
              </span>
            </li>
          ))}
        </ul>
      </Demo>
      <Demo title="Weights">
        <ul className="grid gap-2 text-xl">
          {Object.entries(fontWeights).map(([name, weight]) => (
            <li key={name} style={{ fontWeight: weight }}>
              {name} {weight} — Fare up front, vetted transporters
            </li>
          ))}
        </ul>
      </Demo>
      <Demo
        title="Scripts"
        note="Hindi and Tamil copy ships in a later phase; these lines exist to check the font fallbacks render."
      >
        <ul className="grid gap-4">
          {scripts.map((s) => (
            <li key={s.lang} className="grid gap-1">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <span lang={s.lang} className="text-2xl font-semibold">
                {s.text}
              </span>
            </li>
          ))}
        </ul>
      </Demo>
    </Section>
  );
}

// Full class names so Tailwind can see them (it can't read `text-${name}`).
const textClass: Record<string, string> = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
  "4xl": "text-4xl",
  "5xl": "text-5xl",
  display: "text-display",
};

const durationClass: Record<string, string> = {
  instant: "duration-instant",
  fast: "duration-fast",
  base: "duration-base",
  slow: "duration-slow",
};

const spacingSteps = [1, 2, 3, 4, 6, 8, 12, 16] as const;

export function LayoutTokensSection() {
  return (
    <Section id="space" title="Space, shape, depth, motion">
      <Demo title="Spacing" note="4px base. Tailwind's p-1 = 4px, p-4 = 16px.">
        <ul className="grid gap-2">
          {spacingSteps.map((step) => (
            <li key={step} className="flex items-center gap-3 text-sm">
              <span className="w-24 shrink-0 font-mono">
                {step} · {step * 4}px
              </span>
              <span
                aria-hidden="true"
                className="h-4 rounded-xs bg-primary"
                style={{ width: `calc(var(--spacing) * ${step})` }}
              />
            </li>
          ))}
        </ul>
      </Demo>

      <Demo title="Radius">
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8">
          {[...Object.entries(radii), ["full", "9999px"] as const].map(([name, value]) => (
            <li key={name} className="grid justify-items-start gap-2 text-sm">
              <span
                aria-hidden="true"
                className="size-16 border-2 border-primary bg-primary-soft"
                style={{ borderRadius: name === "full" ? "9999px" : `var(--radius-${name})` }}
              />
              <Code>rounded-{name}</Code>
              <span className="font-mono text-muted-foreground">{value}</span>
            </li>
          ))}
        </ul>
      </Demo>

      <Demo title="Elevation" className="bg-surface-muted">
        <ul className="grid grid-cols-2 gap-6 md:grid-cols-5">
          {Object.keys(shadows.light).map((name) => (
            <li
              key={name}
              className="grid h-24 place-items-center rounded-xl bg-surface text-sm font-semibold"
              style={{ boxShadow: `var(--shadow-${name})` }}
            >
              shadow-{name}
            </li>
          ))}
        </ul>
      </Demo>

      <Demo
        title="Motion"
        note="Sparing: state changes and sheets only. Everything collapses to instant under prefers-reduced-motion. Hover or focus a bar to see it move."
      >
        <ul className="grid gap-4">
          {Object.entries(motion.duration).map(([name, value]) => (
            <li key={name} className="grid gap-2 text-sm md:grid-cols-[12rem_1fr] md:items-center">
              <span>
                <Code>duration-{name}</Code> <span className="font-mono">{value}</span>
              </span>
              <span className="group relative h-11 rounded-lg bg-surface-muted">
                <button
                  type="button"
                  className={`absolute inset-y-1 left-1 w-16 cursor-pointer rounded-md bg-primary text-xs font-semibold text-primary-foreground focus-ring transition-transform ease-standard group-hover:translate-x-24 focus-visible:translate-x-24 ${durationClass[name] ?? ""}`}
                >
                  {name}
                </button>
              </span>
            </li>
          ))}
          {Object.entries(motion.easing).map(([name, value]) => (
            <li key={name} className="text-sm">
              <Code>ease-{name}</Code> <span className="font-mono">{value}</span>
            </li>
          ))}
        </ul>
      </Demo>

      <Demo title="Layers (z-index)" note="Use the named utilities, never raw numbers.">
        <ol className="grid gap-1 text-sm">
          {Object.entries(zIndex).map(([name, value]) => (
            <li key={name} className="flex justify-between gap-4 border-b py-1 last:border-0">
              <Code>z-{name}</Code>
              <span className="font-mono">{value}</span>
            </li>
          ))}
        </ol>
      </Demo>

      <Demo title="Breakpoints" note="Mobile-first. Design at 360px first; there is no sm.">
        <ol className="grid gap-1 text-sm">
          <li className="flex justify-between gap-4 border-b py-1">
            <span>base</span>
            <span className="font-mono">360px (no prefix)</span>
          </li>
          {Object.entries(breakpoints).map(([name, value]) => (
            <li key={name} className="flex justify-between gap-4 border-b py-1 last:border-0">
              <Code>{name}:</Code>
              <span className="font-mono">
                {value} · {Number.parseFloat(value) * 16}px
              </span>
            </li>
          ))}
        </ol>
      </Demo>
    </Section>
  );
}
