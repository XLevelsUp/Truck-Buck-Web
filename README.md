# truckbuck-web

Web surfaces for **TruckBuck**, a closed-network truck booking platform: the public
marketing site and the internal admin console. pnpm workspaces + Turborepo, TypeScript
everywhere. The driver Android app and the API live in other repositories (an `apps/api`
NestJS service is planned to join this monorepo).

## Prerequisites

| Tool     | Version                  | Notes                                                                                           |
| -------- | ------------------------ | ----------------------------------------------------------------------------------------------- |
| Node.js  | **26.13.0** (Active LTS) | Pinned in `.nvmrc` (`nvm use` / `fnm use`). Install fails on other majors (`engineStrict`).     |
| Corepack | latest                   | Node ≥ 25 no longer bundles it: `npm install -g corepack`. It installs the pinned pnpm for you. |
| pnpm     | 12.16.1 (via Corepack)   | Pinned by `packageManager` in `package.json`. Don't install pnpm globally by hand.              |
| Docker   | optional                 | Only to build/run the production images.                                                        |

## Setup

```sh
git clone https://github.com/XLevelsUp/Truck-Buck-Web.git && cd Truck-Buck-Web
npm install -g corepack && corepack enable
pnpm install
pnpm setup:env
pnpm dev
```

Marketing runs on <http://localhost:3000>, admin on <http://localhost:5173> (sign in with
any email and an 8+ character password — auth is mocked).

`pnpm setup:env` copies each app's `.env.example` to `.env.local` (never overwrites).

## Scripts

Run from the repo root. Everything goes through Turborepo, so results are cached and only
affected work re-runs.

| Script                                  | What it does                                                         |
| --------------------------------------- | -------------------------------------------------------------------- |
| `pnpm dev`                              | Both apps in watch mode (marketing :3000, admin :5173).              |
| `pnpm dev:marketing` / `pnpm dev:admin` | One app only.                                                        |
| `pnpm build`                            | Production builds of every app.                                      |
| `pnpm lint`                             | ESLint in every workspace + dependency-cruiser architecture rules.   |
| `pnpm typecheck`                        | `tsc --noEmit` in every workspace.                                   |
| `pnpm test`                             | Vitest unit/component tests with coverage (`<workspace>/coverage/`). |
| `pnpm test:e2e`                         | Playwright smoke tests against production builds (builds first).     |
| `pnpm format` / `pnpm format:check`     | Prettier (with Tailwind class sorting).                              |
| `pnpm clean`                            | Delete build output, caches and `node_modules` everywhere.           |
| `pnpm setup:env`                        | Create missing `.env.local` files from `.env.example`.               |

Target one workspace with Turbo filters, e.g. `pnpm turbo run test --filter=@truckbuck/ui`,
or everything that changed vs `main`: `pnpm turbo run lint test --affected`.

First-time e2e: `pnpm --filter @truckbuck/admin exec playwright install chromium`.

## Repo map

```
apps/
  marketing/          Next.js 16 (App Router, RSC). Public site: home, privacy, terms, 404, SEO.
  admin/              React 19 + Vite SPA. React Router data router, TanStack Query, RHF + Zod.
packages/
  ui/                 Shared components (Radix + cva) and the Tailwind v4 theme (design tokens).
  types/              Domain types + Zod schemas (Booking, Trip, Transporter, Tenant). Depends on zod only.
  api-client/         Typed fetch wrapper: base URL, bearer token, X-Client-Id tenant header, ApiError.
  utils/              Pure helpers: formatINR (paise), IST dates, +91 mobile numbers. No dependencies.
  config-typescript/  tsconfig presets: base, nextjs, vite, react-library.
  config-eslint/      ESLint flat configs: base, library, react, next.
docs/adr/             Architecture decision records.
.github/workflows/    CI.
```

Dependency direction is enforced: apps → packages, never packages → apps or app → app
(`pnpm lint:deps`).

### Internal packages are "just-in-time"

`@truckbuck/*` packages have no build step. Their `exports` point at TypeScript source
(`./src/*.ts(x)`), and each app's bundler (Turbopack / Vite) compiles them. Editing a
package hot-reloads in every app that uses it, and there is no `dist/` to keep in sync.
See [ADR 0001](docs/adr/0001-monorepo-tooling.md) for the trade-offs.

`@truckbuck/ui` exposes one entry per component — import `@truckbuck/ui/button`, not a barrel.

## Environment variables

Each app validates its env with Zod in `src/env.ts` and refuses to start or build with a
readable error if something is missing or malformed.

| App       | Variable                     | Required | Example                                                             | Purpose                                         |
| --------- | ---------------------------- | -------- | ------------------------------------------------------------------- | ----------------------------------------------- |
| marketing | `NEXT_PUBLIC_SITE_URL`       | yes      | `https://truckbuck.in`                                              | Canonical origin: metadata, sitemap, robots, OG |
| marketing | `NEXT_PUBLIC_PLAY_STORE_URL` | yes      | `https://play.google.com/store/apps/details?id=in.truckbuck.driver` | Driver app link (must be a Play Store URL)      |
| admin     | `VITE_API_BASE_URL`          | yes      | `https://api.truckbuck.in/v1`                                       | Base URL for `@truckbuck/api-client`            |
| admin     | `VITE_APP_ENV`               | yes      | `development` \| `test` \| `staging` \| `production`                | Environment label (badge in the top bar)        |

All four are **public** — they are inlined into browser bundles at build time. Never put
secrets in `NEXT_PUBLIC_*` or `VITE_*`. Server-only secrets for marketing go in a separate
`src/env.server.ts` starting with `import "server-only"`.

When you add a variable: update the app's `src/env.ts` schema, `.env.example`, this table,
and the app's `turbo.json` `env` list if it doesn't match an existing wildcard (otherwise
Turbo may serve a cached build made with a different value — `eslint-plugin-turbo` flags this).

## Docker

Both images are built from the repo root (they use `turbo prune` to copy only what each
app needs):

```sh
docker build -f apps/marketing/Dockerfile \
  --build-arg NEXT_PUBLIC_SITE_URL=https://truckbuck.in \
  --build-arg NEXT_PUBLIC_PLAY_STORE_URL="https://play.google.com/store/apps/details?id=in.truckbuck.driver" \
  -t truckbuck/marketing .
docker run --rm -p 3000:3000 truckbuck/marketing

docker build -f apps/admin/Dockerfile \
  --build-arg VITE_API_BASE_URL=https://api.truckbuck.in/v1 \
  --build-arg VITE_APP_ENV=production \
  -t truckbuck/admin .
docker run --rm -p 8080:8080 truckbuck/admin
```

- **marketing**: Next.js `output: "standalone"` server on Node 26 Alpine, non-root user.
- **admin**: static files on nginx with SPA fallback, long-cache hashed assets, `/healthz`.

Public env values are build args, so build one image per environment.

## Adding a new app or package

1. Create `apps/<name>` or `packages/<name>` with a `package.json` named `@truckbuck/<name>`
   (`"private": true`, `"type": "module"`).
2. Extend the shared configs:
   - `tsconfig.json` → `"extends": "@truckbuck/config-typescript/<base|react-library|vite|nextjs>.json"`
   - `eslint.config.js` → spread `library`, `react` or `next` from `@truckbuck/config-eslint`
     and set `tsconfigRootDir: import.meta.dirname` (copy from a sibling workspace).
3. Use `"<dep>": "catalog:"` for any dependency already in the `catalog` of
   `pnpm-workspace.yaml`; add new shared versions there. Internal deps: `"workspace:*"`.
4. Provide the standard scripts where relevant: `dev`, `build`, `lint`, `typecheck`, `test`,
   `test:e2e`. Turbo picks them up automatically.
5. Apps with build output or env vars: add an `apps/<name>/turbo.json` (`"extends": ["//"]`)
   declaring `outputs` and `env` for `build` (see the existing apps).
6. Packages: point `exports` at `src` (JIT). Only add a build step if a consumer can't compile
   TypeScript (e.g. a NestJS app on plain `tsc`) — record why in an ADR.
7. `pnpm install`, then `pnpm lint typecheck test build`.

For `apps/api` (NestJS) specifically, see "Consequences" in ADR 0001.

## Conventions

**Naming**

- Packages: `@truckbuck/<kebab-name>`. Files: `kebab-case.ts(x)`. Components: `PascalCase`.
  Hooks: `useThing`. Zod schemas: `ThingSchema` with `type Thing = z.infer<typeof ThingSchema>`.
- Money is integer **paise** (`Paise`), never floats. Format only at the edge with `formatINR`.
- Times are UTC ISO strings on the wire; display in IST with `@truckbuck/utils`.
- Phone numbers are stored as E.164 (`+919876543210`).
- Multi-tenancy: every tenant-owned schema extends `TenantScopedSchema` (`clientId`). The
  api-client refuses tenant-scoped requests without a tenant; opt out explicitly with
  `{ tenant: false }` only for genuinely global endpoints.
- No `any`. If unavoidable: `// eslint-disable-next-line @typescript-eslint/no-explicit-any -- <reason>`
  (the reason is required by lint).

**Commits** — [Conventional Commits](https://www.conventionalcommits.org/), enforced by
commitlint on `commit-msg`:
`<type>(<scope>): <summary>`, e.g. `feat(admin): add bookings table`. Scopes:
`marketing, admin, ui, types, api-client, utils, config-typescript, config-eslint, ci, deps, docs, repo`.
The `pre-commit` hook runs ESLint `--fix` and Prettier on staged files.

**Branching** — trunk-based. Short-lived branches off `main` named `<type>/<short-desc>`
(`feat/booking-filters`, `fix/inr-rounding`). Open a PR early; CI must be green; squash-merge
with a Conventional Commit title. `main` is always deployable.

## Internationalisation (later)

The marketing site is structured so adding `next-intl` needs no route rewrite:

- All copy lives in `apps/marketing/src/content/en.ts`, read via `getContent()`. It becomes
  `messages/en.json` and `getContent()` becomes `getTranslations()`.
- Routes are listed once in `src/lib/routes.ts` (drives nav and sitemap).
- To add locales: move `src/app/{layout,page,not-found}.tsx`, `privacy/` and `terms/` into
  `src/app/[locale]/`, add `proxy.ts` from next-intl, and prefix paths in `routes.ts`. Page
  components themselves don't change.

## Known gaps

- Auth is mocked (`MockAuthProvider`); no API calls are made anywhere.
- Legal page copy is placeholder and must be replaced with counsel-approved text.
- Marketing CSP allows `'unsafe-inline'` scripts (needed for static App Router pages); see
  `src/lib/security-headers.ts` for the path to nonces or SRI hashes.
- Admin `VITE_*` config is baked in at build time (one image per environment).
- No dark mode yet (tokens are CSS variables, so it's a theme override in `packages/ui`).
- No coverage thresholds yet (reports are generated and uploaded by CI).
