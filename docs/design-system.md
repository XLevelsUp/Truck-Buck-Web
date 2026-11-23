# TruckBuck design system

Status: **Phase 2 deliverable** · Package: `@truckbuck/ui` (shared by marketing and admin) ·
Live reference: [`/styleguide`](http://localhost:3000/styleguide) · Last updated: 2026-11-23

**Direction: reliable infrastructure, consumer-simple.** As easy as booking a cab, as
trustworthy as a bank. Calm, confident, built for Indian roads and low-end Android phones.
Not generic SaaS: no purple gradients, no glassmorphism, no stock handshakes.

---

## 1. Where things live

| What                                       | File                                         | Notes                                                                                          |
| ------------------------------------------ | -------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Token source (only place with raw colours) | `packages/ui/src/tokens/tokens.ts`           | Palette, semantic roles for light + dark, type, space, radius, shadow, motion, z, breakpoints. |
| Generated CSS                              | `packages/ui/src/styles/tokens.css`          | `pnpm --filter @truckbuck/ui tokens`. A test fails if it is stale.                             |
| Tailwind preset + base                     | `packages/ui/src/styles/globals.css`         | Apps import it after `tailwindcss`. Keyframes, `focus-ring`, `page-gutter`.                    |
| Components                                 | `packages/ui/src/components/*.tsx`           | Import one per path: `@truckbuck/ui/button`.                                                   |
| Logo geometry                              | `packages/ui/src/brand/logo-geometry.ts`     | Feeds `<Logo>`, favicons, PWA icons, OG image and `/brand/*.svg`.                              |
| Truck-class icons                          | `packages/ui/src/components/truck-icons.tsx` | 8 icons on lucide's grid.                                                                      |
| Contrast tests                             | `packages/ui/src/tokens/tokens.test.ts`      | Every pair in `contrastPairs`, both themes.                                                    |
| Styleguide                                 | `apps/marketing/src/app/styleguide/`         | `noindex`; e2e + axe at 360/1280 × light/dark.                                                 |

**Rules enforced in CI** (`pnpm lint`):

- No raw colours outside the token folder: ESLint `no-restricted-syntax` for TS/TSX/JS
  (hex, `rgb()`, `hsl()`, `oklch()`…) and `pnpm lint:colors` for CSS.
- Tailwind's default palette, shadows, radii, text sizes and breakpoints are **reset**: `bg-blue-500`,
  `shadow-2xl` or `sm:` simply don't compile. Only TruckBuck tokens exist.

## 2. Colour

### Roles

Components use **roles**, never palette steps. Each role has a light and a dark value.

| Role                                            | Use                                                    |
| ----------------------------------------------- | ------------------------------------------------------ |
| `background` / `foreground`                     | Page and body text                                     |
| `surface`, `surface-muted`                      | Cards, inputs; quiet groupings                         |
| `muted-foreground`                              | Secondary text (still ≥ 4.5:1 on every surface)        |
| `surface-brand`                                 | Blue bands: hero cards, final CTA                      |
| `border`, `border-strong`                       | Hairlines; input borders (≥ 3:1)                       |
| `primary` (+ `-hover`, `-soft`)                 | Brand blue: default action, selected state, links      |
| `accent` (+ `-hover`, `-border`)                | Amber: **conversion CTAs only**                        |
| `link`, `ring`                                  | Inline links; focus indicator                          |
| `success` `warning` `danger` `info` (+ `-soft`) | Status. Text must carry the meaning, not colour alone. |
| `logo-*`                                        | Logo colours (tile stays brand blue in dark mode)      |

### Brand blue

`#1F3A8A` (blue-700) stays the brand primary and logo colour: 10.34:1 with white text.

### Accent decision: amber, not signal green

| Candidate                   | With white text | With dark text (`#1E1D1B`) | Verdict    |
| --------------------------- | --------------- | -------------------------- | ---------- |
| **Amber `#F59E0B`**         | 2.15:1 ✗        | **7.84:1 ✓ (AAA)**         | **Chosen** |
| Signal green `#16A34A`      | 3.30:1 ✗        | 5.31:1 ✓                   | Rejected   |
| Green darkened to `#15803D` | 5.02:1 ✓        | —                          | Rejected   |

Why amber:

1. **Contrast headroom.** Dark text on amber is 7.84:1 (AAA). Green only passes once darkened
   to `#15803D`, where it stops reading as a high-visibility signal.
2. **No semantic clash.** Green already means success ("Delivered", "Verified"). A green CTA next
   to a green success state is ambiguous.
3. **Stands out against the brand.** Amber sits opposite blue on the colour wheel: 4.82:1
   against `#1F3A8A`, so a CTA on a blue band still pops (non-text ≥ 3:1 checked).
4. **Indian-road-aware.** Commercial vehicles in India carry yellow number plates. Amber says
   "truck" without a word.

Amber on white is only 2.15:1, so the CTA button carries a 1px `accent-border` (`#D97706`,
3.19:1 on white) so its edge passes WCAG 1.4.11. Use amber for **one** conversion action per
view; everything else is `primary` (blue) or `secondary`.

### Contrast

All pairs in `contrastPairs` are checked by a unit test in both themes: 4.5:1 for text,
3:1 for borders, focus rings and other UI. The tightest pairs are `danger` on `background`
(4.67:1) and `accent-border` on `background` (3.08:1). `/styleguide` lists every live ratio.

### Dark mode

Light by default; dark follows the OS (`prefers-color-scheme`). Force either with
`data-theme="light" | "dark"` on `<html>` **or any element**: nested themes work because every
component reads CSS variables. No `dark:` variants are needed. The admin app is pinned to
`data-theme="light"` until its screens are reviewed in dark.

## 3. Typography

- **One family: Geist (variable)** for UI and headlines, via `next/font` (self-hosted, `swap`).
- **Script fallbacks:** Noto Sans Devanagari and Noto Sans Tamil are declared with
  `preload: false`. Each has a `unicode-range`, so English pages download zero bytes of them.
- **No separate display face.** Geist's 700–800 weights carry headlines. A second family
  would cost about 30 KB on the LCP path for little gain. Revisit with a real brand typeface.
- **Fluid scale.** `xs`–`base` are fixed (inputs stay at 16px, so iOS doesn't zoom). From `lg` up,
  sizes interpolate between 360px and 1280px with `clamp()`:

| Token     | 360px | 1280px | Line height |
| --------- | ----- | ------ | ----------- |
| `xs`      | 12    | 12     | 16px        |
| `sm`      | 14    | 14     | 20px        |
| `base`    | 16    | 16     | 24px        |
| `lg`      | 17    | 18     | 1.6         |
| `xl`      | 18    | 20     | 1.5         |
| `2xl`     | 20    | 24     | 1.35        |
| `3xl`     | 24    | 30     | 1.25        |
| `4xl`     | 28    | 36     | 1.2         |
| `5xl`     | 32    | 48     | 1.1         |
| `display` | 36    | 60     | 1.05        |

## 4. Space, shape, depth, motion, layers, layout

- **Spacing:** 4px base (`p-1` = 4px). Page gutters: 16px at 360px, 24px from `md` (`page-gutter`).
- **Radius:** `xs` 2 · `sm` 4 · `md` 6 · `lg` 8 (buttons, inputs) · `xl` 12 (cards) · `2xl` 16 ·
  `3xl` 24 (sheets) · `full`.
- **Elevation:** `shadow-xs` → `shadow-xl`, tinted warm grey in light mode, deeper in dark mode.
- **Motion:** `duration-fast` 120ms (hover, toggles) · `duration-base` 200ms (fades) · `duration-slow`
  320ms (sheets). Easing `ease-standard` / `ease-enter` / `ease-exit`. Everything is instant under
  `prefers-reduced-motion`. Framer Motion is not a dependency; CSS covers what we need.
- **Layers:** `z-raised` 10 · `z-sticky` 20 (header) · `z-bottom-bar` 30 · `z-overlay` 40 · `z-modal` 50
  · `z-popover` 60 · `z-toast` 70 · `z-skip-link` 80. Never raw numbers.
- **Breakpoints:** design at **360px with no prefix**, then `xs` 360 · `md` 768 · `lg` 1024 · `xl` 1280
  · `2xl` 1536. There is no `sm`.
- **Touch targets:** 44px minimum (`touch-target` utility; buttons and inputs default to 44px).
- **Focus:** `focus-ring` = 2px ring + 2px offset in the page colour, visible on light, dark and
  brand surfaces. Elements that don't opt in still get a 2px outline from the base layer.

## 5. Components

Radix primitives where they add real behaviour (focus trap, roving focus, positioning); native
HTML where the browser already does it better. Every user-visible default string (e.g. "Close",
"No matches") is a prop, so translations can override it.

| Component                                   | Built on              | Notes                                                                                                                                                                                                                           |
| ------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`                                    | native / Radix Slot   | `primary` (blue) · `cta` (amber) · `secondary` · `ghost` · `link` · `danger`; `sm` 36 · `md` 44 · `lg` 52 · `icon`; `loading` keeps the label in the accessibility tree, sets `aria-busy`, blocks resubmits. Server-renderable. |
| `Input`, `Field`                            | native                | `Field` wires label, hint, error (`aria-describedby`, `aria-invalid`, `aria-required`). Marks _optional_ fields.                                                                                                                |
| `PhoneInput`                                | native `tel`          | Fixed +91, numeric keypad, formats `98765 43210`, strips a pasted +91/0. Works without JS; normalise on the server with `normalizeIndianMobile`.                                                                                |
| `Select`                                    | Radix Select          | Short fixed lists.                                                                                                                                                                                                              |
| `Combobox`                                  | custom, WAI-ARIA 1.2  | Truck and city search; `filter={false}` + `onInputChange` for Places search (Phase 4). Value must come from the list.                                                                                                           |
| `DatePicker`                                | native `date` + chips | "Today / Tomorrow" chips plus the native picker: the most familiar picker on low-end Android, zero JS. IST dates.                                                                                                               |
| `SegmentedControl`                          | Radix RadioGroup      | 2–4 options.                                                                                                                                                                                                                    |
| `Card`                                      | —                     | `outline` · `raised` · `muted` · `brand`; `interactive`.                                                                                                                                                                        |
| `Badge`, `Tag`, `FilterTag`, `RemovableTag` | —                     | Status labels; static, toggle (`aria-pressed`) and removable chips.                                                                                                                                                             |
| `Tabs`                                      | Radix Tabs            | Scrolls horizontally at 360px.                                                                                                                                                                                                  |
| `Accordion`                                 | native `details`      | Zero JS, answers stay in the HTML (FAQ rich results, find-in-page). Same `name` makes it exclusive.                                                                                                                             |
| `Dialog`, `Sheet`                           | Radix Dialog          | Sheet = bottom sheet (mobile pickers) or right drawer (mobile nav).                                                                                                                                                             |
| `Toast` / `Toaster`                         | Radix Toast           | Confirmations only; blocking errors go inline.                                                                                                                                                                                  |
| `Tooltip`                                   | Radix Tooltip         | Supplementary only (touch can't hover).                                                                                                                                                                                         |
| `Stepper`                                   | —                     | `aria-current="step"`; numbers on mobile, labels from `md`.                                                                                                                                                                     |
| `Skeleton`, `EmptyState`                    | —                     | Skeleton matches final size (CLS); empty states always offer a next step.                                                                                                                                                       |
| `Stat`                                      | `dl`                  | **`source` is required.** No number without one.                                                                                                                                                                                |
| `Testimonial`, `LogoCloud`                  | `figure`, `ul`        | Real, consented content only; `LogoCloud` renders nothing when empty.                                                                                                                                                           |
| `TruckCard`                                 | `article`             | Specs come from `truck_types`, never typed into copy.                                                                                                                                                                           |
| `PriceBreakdown(Row)`                       | `dl`                  | Integer paise in; `₹1,23,456` out (`formatINR`). `line` · `discount` · `total`.                                                                                                                                                 |
| `MapContainer`                              | `figure`              | Reserves the ratio, shows a static placeholder, always has a text label. Maps JS loads on interaction (Phase 4).                                                                                                                |
| `StatusTimeline`                            | `ol`                  | Requested → Accepted → Driver assigned → In transit → Delivered.                                                                                                                                                                |
| `Logo`                                      | inline SVG            | `horizontal` · `stacked` · `mark`; themed by tokens.                                                                                                                                                                            |

## 6. Iconography

- **lucide** (`lucide-react`, pinned) for interface icons. 24px grid, 2px stroke.
- **8 custom truck-class icons** on the same grid and stroke: Mini truck, Pickup, LCV 14–17 ft,
  19–22 ft, Container 24 ft+, Open body, Trailer, Refrigerated. They face right (direction of
  travel) and share a wheel baseline, so a row of them lines up.
- Icons are **decorative by default** (`aria-hidden`). Give one a `title` only when it carries
  meaning that no adjacent text does. Icon-only buttons need an `aria-label`.
- Sizes: 16px inline in text, 20px in buttons and inputs, 24px standalone, 48px+ in cards.

## 7. Logo

**Construction.** A rounded road-blue tile, a geometric white **TB** monogram, and three amber
**lane dashes**: the road the network runs on. The wordmark "TruckBuck" is drawn from the same
stroke system rather than set in a font, so it renders identically everywhere and needs no font
licence.

| Lockup      | Use                              | File                                                                                                                                |
| ----------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Horizontal  | Header, footer, documents        | `/brand/truckbuck-horizontal.svg` · `-reversed.svg`                                                                                 |
| Stacked     | Splash, square placements, merch | `/brand/truckbuck-stacked.svg` · `-reversed.svg`                                                                                    |
| Mark        | Favicon, app icon, avatars       | `/brand/truckbuck-mark.svg`                                                                                                         |
| Favicon set | Browser tab, iOS, Android        | `favicon.svg`, `icon-32.png`, `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (80% safe zone) |
| OG template | Share previews                   | `src/lib/og.tsx`: brand-blue field, headline, lane dashes. One call per route.                                                      |

All are generated at build time from `logo-geometry.ts` + tokens. Nothing is hand-exported.

- **Clear space:** at least twice the lane-dash height on every side.
- **Minimum size:** mark 16px; horizontal lockup 96px wide.
- **Don't:** recolour the tile, rotate or stretch it, add effects or shadows, place the
  positive lockup on photos (use `-reversed`), or rebuild the wordmark in a font.

## 8. Imagery

**Show the real thing.** Indian highways, toll plazas, loading bays, warehouses, trucks with
Indian body styles (open body, containers, trailers), and real drivers and staff who have given
consent.

- **Never:** smiling-handshake stock, Western highways or right-hand-traffic scenes, generic
  "logistics" globes, competitor branding, or AI-generated people presented as real.
- **When there are no photos:** use illustrated or 3D-style truck renders in the brand palette
  (blue body, amber accents, warm-grey ground), flat lighting and a three-quarter front view.
  Label them as illustrations; never pass them off as our fleet.
- **Art direction:** daylight or early-morning light, eye level, natural colour (no heavy
  filters, no teal-orange grading). Trucks moving left-to-right (matching the icons) or parked
  at a dock. People doing real work, not posing.
- **Privacy:** blur number plates and faces of people who haven't consented. No customer
  documents or invoices in frame.
- **Aspect ratios:**

| Ratio    | Use                                      |
| -------- | ---------------------------------------- |
| 4:3      | Truck cards, product shots (`TruckCard`) |
| 3:2      | Editorial and section photos             |
| 16:9     | Wide banners, blog covers, map previews  |
| 1:1      | Avatars, logos, social squares           |
| 1200×630 | Open Graph images (template only)        |

- **Performance:** `next/image`, AVIF/WebP, explicit `sizes`. Under 200 KB per photo at
  1280px. Never put an image on the LCP path above the hero text.
- **Alt text:** describe what matters ("Open-body truck loading steel coils at a dock"). Use
  `alt=""` for purely decorative images.

## 9. Adding to the system

- **New colour:** add a role to `colorRoles` and both themes in `tokens.ts`, add a
  `contrastPairs` entry if it carries text or UI, run `pnpm --filter @truckbuck/ui tokens`, then
  use `bg-<role>` / `text-<role>`.
- **New component:** `packages/ui/src/components/<name>.tsx`, tokens only, 44px targets, strings
  as props, a test for its keyboard and ARIA behaviour, and a demo on `/styleguide` (the axe e2e
  test then covers it).
