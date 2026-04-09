# AntiGravity Task: Restructure `embed-club2` to Enterprise/Production Level

## Context
This is a **PayloadCMS + Next.js 15.4.4** project (App Router). The current structure has good bones but lacks enterprise-level organization. Your job is to reorganize the **`src/`** directory and **root-level config files** following production standards — without breaking PayloadCMS or Next.js routing conventions.

**Do NOT touch:**
- `.claude/`, `.agents/`, `.agent/` — these are AI tooling directories, leave them as-is
- `node_modules/`, `.next/`, `.git/`, `.github/` — never touch these
- Root config files: `.env`, `.gitignore`, `biome.json`, `next.config.mjs`, `package.json`, `pnpm-lock.yaml`, `postcss.config.js`, `tailwind.config.js`, `tsconfig.json`, `playwright.config.ts`, `vitest.config.mts`, `vitest.setup.ts`, `components.json`, `.npmrc`, `.yarnrc`, `.mcp.json` — these stay at root, do not move them
- `CLAUDE.md`, `README.md`, `example.html`, `skills-lock.json` — keep at root

---

## Required New Structure

Reorganize `src/` to match the following enterprise layout. **Move existing files — do not delete them.** Update all import paths accordingly.

```
src/
├── app/                          ← Next.js App Router (keep PayloadCMS routing intact)
│   ├── (frontend)/               ← Keep as-is (Next.js route group)
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   ├── globals.css
│   │   ├── styles.css
│   │   ├── fonts.ts
│   │   ├── achievements/page.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   └── title.tsx
│   │   ├── events/page.tsx
│   │   ├── gallery/page.tsx
│   │   ├── members/page.tsx
│   │   ├── practice/
│   │   │   ├── page.tsx
│   │   │   ├── dashtitle.tsx
│   │   │   └── gsap.tsx
│   │   ├── resources/
│   │   │   ├── page.tsx
│   │   │   ├── ResourcesPageContent.tsx
│   │   │   └── [slug]/page.tsx
│   │   ├── simulators/page.tsx
│   │   └── tutorials/page.tsx
│   ├── (payload)/                ← Keep as-is (PayloadCMS admin group)
│   │   ├── custom.scss
│   │   ├── layout.tsx
│   │   ├── admin/
│   │   │   ├── importMap.js
│   │   │   └── [[...segments]]/
│   │   │       ├── page.tsx
│   │   │       └── not-found.tsx
│   │   └── api/
│   │       ├── graphql/route.ts
│   │       ├── graphql-playground/route.ts
│   │       └── [...slug]/route.ts
│   └── my-route/route.ts         ← Keep (custom route)
│
├── payload/                      ← NEW: All PayloadCMS-specific code grouped here
│   ├── payload.config.ts         ← MOVED from src/payload.config.ts
│   ├── payload-types.ts          ← MOVED from src/payload-types.ts
│   ├── collections/              ← MOVED from src/collections/
│   │   ├── Achievements.ts
│   │   ├── Audio.ts
│   │   ├── Events.ts
│   │   ├── Gallery.ts
│   │   ├── Media.ts
│   │   ├── MemberCategories.ts
│   │   ├── MemberPhoto.ts
│   │   ├── MemberRoles.ts
│   │   ├── Members.ts
│   │   ├── Resources.ts
│   │   ├── Tags.ts
│   │   └── Users.ts
│   └── fields/                   ← NEW: Reusable PayloadCMS field configs
│       └── .gitkeep
│
├── components/                   ← Reorganized into feature + shared buckets
│   ├── ui/                       ← shadcn/ui primitives (keep as-is)
│   │   ├── button.tsx
│   │   ├── field.tsx
│   │   ├── focus-cards.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── pagination.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   ├── sidebar.tsx
│   │   ├── skeleton.tsx
│   │   └── tooltip.tsx
│   ├── animate-ui/               ← Keep as-is (third-party animation library)
│   │   ├── components/
│   │   ├── icons/
│   │   └── primitives/
│   ├── admin/                    ← PayloadCMS custom admin components (keep as-is)
│   │   ├── AudioSliderField.tsx
│   │   ├── LeafletLocationField.tsx
│   │   ├── LeafletMap.tsx
│   │   ├── SortOrderSelectCategory.tsx
│   │   └── SortOrderSelectRole.tsx
│   ├── layout/                   ← NEW: Shell, nav, menu components
│   │   ├── FrontendShell.tsx     ← MOVED
│   │   ├── FrontendShellWrapper.tsx ← MOVED
│   │   ├── DesktopMenu.tsx       ← MOVED
│   │   ├── MobileMenu.tsx        ← MOVED
│   │   ├── StaggeredMenu.tsx     ← MOVED
│   │   └── ContentPanel.tsx      ← MOVED
│   ├── theme/                    ← NEW: Theming components
│   │   ├── ThemeProvider.tsx     ← MOVED
│   │   ├── ThemeToggle.tsx       ← MOVED
│   │   ├── ThemeWrapper.tsx      ← MOVED
│   │   └── ThemedStarsBackground.tsx ← MOVED
│   ├── features/                 ← NEW: Feature-specific components grouped by domain
│   │   ├── events/
│   │   │   ├── EventDetails.tsx  ← MOVED
│   │   │   ├── EventsCards.tsx   ← MOVED
│   │   │   └── EventsCarousel.tsx ← MOVED
│   │   ├── resources/
│   │   │   ├── ResourceCard.tsx  ← MOVED
│   │   │   └── ResourceCards.tsx ← MOVED
│   │   ├── gallery/
│   │   │   └── Masonry.tsx       ← MOVED
│   │   └── timeline/
│   │       └── UnifiedTimeline.tsx ← MOVED
│   └── common/                   ← NEW: Shared/generic components
│       ├── ChromaGrid.tsx        ← MOVED
│       ├── ChromaGridWrapper.tsx ← MOVED
│       ├── ChromaScene.tsx       ← MOVED
│       ├── cursor.tsx            ← MOVED
│       ├── DecryptedText.tsx     ← MOVED
│       ├── ElasticSlider.tsx     ← MOVED
│       ├── RichTextRender.tsx    ← MOVED
│       └── SearchBar.tsx         ← MOVED
│
├── hooks/                        ← Keep, rename to camelCase consistently
│   ├── use-is-in-view.tsx
│   ├── use-mobile.tsx
│   ├── use-outside-click.ts
│   └── useTimelineScroll.ts
│
├── lib/                          ← Shared utilities and helpers
│   ├── utils.ts                  ← Keep
│   └── get-strict-context.tsx    ← Keep
│
├── styles/                       ← NEW: Move font assets here
│   └── fonts/                    ← MOVED from app/(frontend)/fonts/
│       ├── ITCAvantGardeStd-Bk.woff2
│       ├── ITCAvantGardeStd-BkCn.woff2
│       └── ... (all woff2 files)
│
└── types/                        ← NEW: App-wide TypeScript types
    └── index.ts                  ← Create empty barrel file
```

---

## Key Rules to Follow

### PayloadCMS Critical Constraints
1. **`payload.config.ts` must be importable from `next.config.mjs`** — after moving it to `src/payload/payload.config.ts`, update the `withPayload()` import path in `next.config.mjs`.
2. **`payload-types.ts`** is auto-generated by PayloadCMS CLI. After moving, update the `outputFile` path in `payload.config.ts` to `'./src/payload/payload-types.ts'`.
3. **Admin `importMap.js`** at `src/app/(payload)/admin/importMap.js` — this is auto-generated too. Ensure any custom component paths referenced inside it point to `src/components/admin/...` (they likely already do, just verify).
4. **Collections** — after moving to `src/payload/collections/`, update imports inside `payload.config.ts`.

### Next.js 15 App Router Constraints
- Never move anything inside `src/app/` except as noted above — route groups `(frontend)` and `(payload)` are sacred.
- `next-env.d.ts` stays at root.
- Font files move to `src/styles/fonts/` — update the `localFont()` references in `src/app/(frontend)/fonts.ts`.

### Import Path Updates (critical — do all of these)
After moving files, do a project-wide find-and-replace for these path prefixes:

| Old import | New import |
|---|---|
| `@/collections/` | `@/payload/collections/` |
| `@/payload.config` | `@/payload/payload.config` |
| `@/payload-types` | `@/payload/payload-types` |
| `@/components/FrontendShell` | `@/components/layout/FrontendShell` |
| `@/components/FrontendShellWrapper` | `@/components/layout/FrontendShellWrapper` |
| `@/components/DesktopMenu` | `@/components/layout/DesktopMenu` |
| `@/components/MobileMenu` | `@/components/layout/MobileMenu` |
| `@/components/StaggeredMenu` | `@/components/layout/StaggeredMenu` |
| `@/components/ContentPanel` | `@/components/layout/ContentPanel` |
| `@/components/ThemeProvider` | `@/components/theme/ThemeProvider` |
| `@/components/ThemeToggle` | `@/components/theme/ThemeToggle` |
| `@/components/ThemeWrapper` | `@/components/theme/ThemeWrapper` |
| `@/components/ThemedStarsBackground` | `@/components/theme/ThemedStarsBackground` |
| `@/components/EventDetails` | `@/components/features/events/EventDetails` |
| `@/components/EventsCards` | `@/components/features/events/EventsCards` |
| `@/components/EventsCarousel` | `@/components/features/events/EventsCarousel` |
| `@/components/ResourceCard` | `@/components/features/resources/ResourceCard` |
| `@/components/ResourceCards` | `@/components/features/resources/ResourceCards` |
| `@/components/Masonry` | `@/components/features/gallery/Masonry` |
| `@/components/UnifiedTimeline` | `@/components/features/timeline/UnifiedTimeline` |
| `@/components/ChromaGrid` | `@/components/common/ChromaGrid` |
| `@/components/ChromaGridWrapper` | `@/components/common/ChromaGridWrapper` |
| `@/components/ChromaScene` | `@/components/common/ChromaScene` |
| `@/components/cursor` | `@/components/common/cursor` |
| `@/components/DecryptedText` | `@/components/common/DecryptedText` |
| `@/components/ElasticSlider` | `@/components/common/ElasticSlider` |
| `@/components/RichTextRender` | `@/components/common/RichTextRender` |
| `@/components/SearchBar` | `@/components/common/SearchBar` |
| `(frontend)/fonts/` (in fonts.ts) | `@/styles/fonts/` |
| `@/components/lib/utils` | `@/lib/utils` (consolidate — remove the duplicate) |

### Duplicate to Resolve
`src/components/lib/utils.ts` and `src/lib/utils.ts` are likely the same file. Verify they have identical content, keep only `src/lib/utils.ts`, delete `src/components/lib/utils.ts` and `src/components/lib/utils.d.ts`, and update the one import that referenced the component-level one.

---

## Also Add These New Files

### `src/types/index.ts`
```ts
// Global type barrel — add shared types here as the project grows
export type {}
```

### `src/payload/fields/.gitkeep`
Empty file — reserves the folder for future reusable Payload field definitions.

### Update `tsconfig.json` paths (if `@/` isn't already aliased)
Ensure this exists in `tsconfig.json` compilerOptions:
```json
"paths": {
  "@/*": ["./src/*"]
}
```

---

## What NOT to Do
- Do not rename any collection files (e.g., `Members.ts` stays `Members.ts`)
- Do not change the PayloadCMS slug configs inside collection files
- Do not touch `.claude/agents/` — those are AI agent definitions, not app code
- Do not create barrel `index.ts` files for collections or app routes
- Do not add any new npm dependencies
- Do not modify `biome.json`, `tailwind.config.js`, or `postcss.config.js`

---

## Verification Checklist (run after restructuring)
1. `pnpm build` completes without errors
2. `pnpm dev` starts and admin panel loads at `/admin`
3. All frontend routes (`/`, `/events`, `/members`, etc.) resolve correctly
4. No broken import errors in TypeScript (`pnpm tsc --noEmit`)
5. `pnpm test` (vitest) still passes
