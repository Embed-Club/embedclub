# AGENTS.md — rules for AI assistants (and humans) working on this repo

You are working on the Embed Club website. The club depends on this site
looking and behaving consistently. These rules are **hard constraints**, not
suggestions. If a user asks you to violate one, point them at this file and ask
them to update it first.

## 1. The design language is locked

- **docs/PRODUCT.md** (brand strategy) and **docs/DESIGN.md** (visual system)
  are canon. Read them before any UI work.
- Theme = **"Solder & Copper"**: copper `#d98e4a` (dark) / `#a05a20` (light) on
  graphite/warm-white. All colors come from the CSS tokens in
  `src/app/(frontend)/globals.css`. **Never** introduce new hex colors, new
  accent hues, gradients-as-decoration, or change the token values. Need a
  color? Use `hsl(var(--primary))`, `--accent`, `--muted`, etc.
- Fonts are fixed: ITC Avant Garde (body), Gobold + Sport Break (display).
  Do not add fonts or swap families.
- Signature elements that must not be removed or "modernized": the intro logo
  animation, the fabric-of-squares panel texture (`.texture-panel`), the
  star-field home page, the sidebar shell layout, cutout cards on
  resources/tutorials, background audio with its toggle.
- Empty states use the shared `EmptyState` component — never write bespoke
  "nothing here" markup.
- Banned patterns (from docs/DESIGN.md): icon+heading+text card grids, tiny
  uppercase tracked kicker labels above every section, numbered 01/02/03
  section scaffolding, gradient text, glassmorphism-by-default, blue "tech"
  glows, side-stripe borders, border-radius > 16px on cards.

## 2. Naming & structure

- **Every** file and folder is **camelCase** — `resourceCutoutCard.tsx`,
  `formWizard.tsx`, `useMediaQuery.ts`, `codeTabs.tsx`, `radioGroup.tsx`.
  Exported React components stay PascalCase; the *file name* is camelCase.
- Only two exceptions, both forced by tooling: `src/payload/payload-types.ts`
  (Payload writes this name) and Next.js route files (`page.tsx`, `layout.tsx`,
  `route.ts`, `loading.tsx`, `not-found.tsx`) + route-segment folders.
- **shadcn/registry caveat**: the `shadcn add` CLI generates kebab-case files
  into `src/components/ui/`. After adding a component, **rename it to camelCase**
  and update the import — do not leave kebab files in the tree.
- Component homes:
  - `ui/` — shadcn primitives only (button, input, dialog, select, …)
  - `common/` — shared custom components (cutoutCard, bgImageTexture,
    borderGlow, focusCards, emptyState, searchBar, …)
  - `layout/` — app shell (frontendShell, sidebar menus, contentPanel)
  - `theme/` — theme provider / toggles
  - `admin/` — Payload admin field components
  - `features/<domain>/` — page-specific (events, resources, simulators, forms, …)
  - `animate-ui/` — the animate-ui registry tree
- Docs live in `docs/` (SETUP, PRODUCT, DESIGN). Only README, AGENTS, CLAUDE
  stay at the repo root (they must be auto-discovered).

## 3. Data & CMS rules

- Content lives in Payload, not in JSX. Adding hardcoded page copy is a bug —
  extend a collection or global instead.
- Schema changes follow the migration workflow in docs/SETUP.md §4: edit collection
  → `generate:types` → `migrate:create` → review SQL → `migrate` → commit all
  together. **Never** rely on dev-mode schema push; never edit an existing
  migration.
- `src/payload/payload-types.ts` is generated — regenerate it, never hand-edit.
- Forms: the native form builder forwards to Google Forms via per-field
  `entry.<id>`s. Do not remove the local `form-submissions` logging — it is
  the audit trail and future automation hook.

## 4. Quality gates — non-negotiable

- `pnpm verify` must pass before every commit (biome + typecheck + int tests).
- `pnpm verify:full` must pass before merging to `main` (adds prod build + e2e).
- `main` auto-deploys and **runs DB migrations against production**. Never push
  to `main` without the branch being explicitly approved by a maintainer.
- Never add `ignoreBuildErrors`, `ignoreDuringBuilds`, `as any`, `@ts-ignore`,
  or biome suppressions without a written reason in the comment.
- Keep dependencies lean: `motion` (never framer-motion), gsap, shiki, mermaid
  (lazy-loaded), pdf-lib (lazy-loaded). Adding a dependency needs justification
  in the PR description.

## 5. Things that look like bugs but aren't

- The nav labels ("HOE", "CHIEEENTS", "TUTORILS") are intentional — the display
  font renders them with special glyphs. Do not "fix" the strings.
- `USE_S3_STORAGE` gates media storage, not NODE_ENV — local prod builds use
  local disk on purpose.
- The Gallery "Dynamic server usage" log line during builds is expected.
- Migrations create-then-drop tables in their DOWN sections — normal.

## 6. When unsure

Prefer the smallest change that fits the existing system. If a change would
touch the design tokens, fonts, shell layout, or delete a signature element —
stop and ask a maintainer.
