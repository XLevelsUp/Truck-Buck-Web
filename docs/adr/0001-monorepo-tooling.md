# ADR 0001: Monorepo tooling

- **Status:** Accepted
- **Date:** 2026-10-31
- **Deciders:** TruckBuck web team

## Context

TruckBuck needs two web surfaces now — a public marketing site and an internal admin
console — and a NestJS API (`apps/api`) plus further apps later. Three developers will
maintain it. Priorities: long-term maintainability, fast CI, shared UI and domain types, and
no restructuring when new apps arrive. The platform is multi-tenant from day one.

## Decisions

### 1. pnpm workspaces

- **Strict, content-addressed `node_modules`.** Packages can only import what they declare,
  which stops phantom dependencies from spreading across workspaces. npm and Yarn's hoisted
  layouts allow them.
- **Catalogs (`catalog:`).** Each shared dependency version is defined once in
  `pnpm-workspace.yaml`, so React/TypeScript/Zod can't drift between apps.
- **Fast, disk-efficient installs**, and Corepack pins the exact version through
  `packageManager`.
- **Strictness:** `strictPeerDependencies: true`, `autoInstallPeers: false` and
  `engineStrict: true`. A peer conflict fails the install in the PR that causes it. Since
  pnpm 11 these settings live in `pnpm-workspace.yaml`; `.npmrc` holds only npm-compatible
  settings.

_Rejected:_ npm workspaces (no catalogs, weaker isolation). Yarn Berry (PnP friction with
Next.js, Playwright and editor tooling; a smaller ecosystem for the team to learn).

### 2. Turborepo as the task runner

- **Fit:** it orchestrates `package.json` scripts with almost no config, so every workspace
  stays a normal package.
- **Content-hashed caching:** local and remote cache (Vercel or self-hosted) with
  `--affected`, so CI runs only what a change touches.
- **`turbo prune --docker`** builds small, cache-friendly Docker contexts per app.
- **The `transit` pattern:** `lint`, `typecheck`, `test` and `build` depend on a no-op
  `transit` task with `dependsOn: ["^transit"]`. A source change in `@truckbuck/ui`
  therefore invalidates the cached results of every app that imports it, even though JIT
  packages have no build task, while all those tasks still run in parallel.
- **Env-var hashing:** each app's `turbo.json` declares `NEXT_PUBLIC_*` / `VITE_*` as
  inputs, and `eslint-plugin-turbo` flags undeclared ones.

_Rejected:_ Nx — more capable, but heavier (plugins, generators, project.json) than a
3-person team needs. Turborepo can be swapped out later because the scripts are plain.

### 3. Vite (not Next.js) for the admin console

- **No SSR or SEO need:** the admin is auth-gated and fully client-rendered.
- **Simple deployment:** a static bundle on nginx, with no Node server to run, patch or scale.
- **A simpler mental model:** no RSC server/client boundary for internal CRUD screens that
  are driven by TanStack Query.
- **Fast feedback:** quick dev server and HMR, and a fast production build (Rolldown).
- **Routing:** React Router's data router provides lazy route modules, error boundaries
  and loaders without a framework.

The marketing site stays on Next.js because SEO, metadata, static prerendering and image/font
optimisation matter there.

### 4. Just-in-time (JIT) internal packages

`@truckbuck/*` packages export TypeScript source (`exports` → `./src/...`). The consuming
bundler compiles them, so there is no per-package build step.

- **Pros:**
  - Zero build orchestration.
  - Instant HMR across packages.
  - Go-to-definition lands in real source.
  - One TypeScript and JSX config per consumer.
  - CI only builds apps.
- **Cons:**
  - Every consumer must compile TypeScript and resolve `exports`. Turbopack and Vite do;
    plain Node and `tsc`-compiled CommonJS do not.
  - A package's TS settings must be compatible with each consumer's. The shared base
    config enforces that.
  - Typecheck runs over package source once per app.
- **Exceptions:** none today. A package gets a build step only when a consumer can't
  compile TypeScript; that is expected for `@truckbuck/types` once `apps/api` exists (see
  Consequences).

### 5. Additions beyond the brief's library list

| Library                                                  | Why                                                                                                                                           |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `radix-ui` (unified package)                             | The brief asks for Radix primitives; the single package replaces about 8 `@radix-ui/react-*` installs.                                        |
| `class-variance-authority`, `clsx`, `tailwind-merge`     | The brief asks for cva and `cn()`; `cn()` is `twMerge(clsx(...))`.                                                                            |
| `eslint-plugin-simple-import-sort`                       | Import ordering: zero-config and autofixable, with no resolver setup (unlike `eslint-plugin-import` ordering).                                |
| `eslint-plugin-jsx-a11y`                                 | Accessibility linting for `ui` and `admin`; marketing already gets it via `eslint-config-next`.                                               |
| `eslint-plugin-turbo`                                    | Fails lint when code reads an env var that Turbo doesn't hash, which would otherwise serve stale cached builds.                               |
| `@eslint-community/eslint-plugin-eslint-comments`        | Enforces "no `any` without a comment explaining why": every `eslint-disable` must carry a `-- reason`.                                        |
| `eslint-config-prettier`, `globals`, `typescript-eslint` | Standard flat-config plumbing.                                                                                                                |
| `dependency-cruiser`                                     | Named in the brief. Enforces no circular imports, packages ↛ apps, app ↛ app, imports through `exports` only, and no undeclared dependencies. |
| `@tailwindcss/turbopack`                                 | The Tailwind v4 integration that `create-next-app` 16.4 generates for Turbopack (replaces `@tailwindcss/postcss`).                            |
| `jsdom`, `@testing-library/*`, `@vitest/coverage-v8`     | The Vitest + Testing Library setup the brief requires, plus coverage.                                                                         |

No icon library: the UI package ships one inline SVG. Toasts use Radix Toast rather than
`sonner`, to stay within the Radix primitives.

### 6. Version pins that deviate from "latest"

- **TypeScript `~6.0.3`, not 7.x.** TypeScript 7 (the native Go compiler) is the latest
  release, but `typescript-eslint` supports `>=4.8.4 <6.1.0`, so typed linting can't run
  on 7. Revisit when typescript-eslint supports 7.
- **ESLint `^9.39`, not 10.x.** `eslint-config-next` depends on `eslint-plugin-react` and
  `eslint-plugin-jsx-a11y`, which declare peers only up to ESLint 9. With
  `strictPeerDependencies` (required by the brief), ESLint 10 fails the install.

### 7. Tailwind v4 theme as the shared "preset"

Tailwind v4 has no JS presets. `packages/ui/src/styles/globals.css` defines the tokens once
(CSS variables mapped through `@theme`), and its `@source` directives make every consuming
app scan the `ui` sources. Apps just `@import "@truckbuck/ui/styles.css"`.

## Consequences

- **Adding a Vite or Next app:** copy an existing app's `tsconfig.json`, `eslint.config.js`
  and `turbo.json`. No package changes are needed.
- **Adding `apps/api` (NestJS):**
  - Nest compiles with `tsc` to CommonJS and runs on plain Node, so it can't consume JIT
    packages as they are.
  - Options:
    - (a) Give `@truckbuck/types` (and whatever else the API imports) a build step with
      `tsdown`/`tsc`, adding `"import"`/`"require"` conditions to `exports`.
    - (b) Bundle the Nest app with a bundler that compiles workspace TypeScript.
  - Prefer (a) for `types` only, and record it in a new ADR.
  - Longer term, generate `@truckbuck/types` from the API's OpenAPI spec so the contract has
    one owner.
- **Remote caching** is ready: set `TURBO_TOKEN` (secret) and `TURBO_TEAM` (variable) in
  GitHub.
- **Upgrading tooling:**
  - Bump versions in the `catalog`.
  - The TypeScript 7 and ESLint 10 pins above need a deliberate upgrade PR once the
    ecosystem catches up.
