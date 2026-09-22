# Setup Guide

Everything you need to run, develop, and deploy the Embed Club website. Written
for future maintainers - read this before touching anything.

## 1. Prerequisites

- **Node.js** ≥ 20.9
- **pnpm** 9 or 10 (`npm i -g pnpm`)
- A **Neon** Postgres database (dev branch of the club's Neon project, or your own free project)
- (Optional, prod-only) a **Supabase** project for S3-compatible media storage

## 2. Clone & install

```bash
git clone https://github.com/Embed-Club/embedclub.git
cd embedclub
pnpm install
```

## 3. Environment

```bash
cp .env.example .env
```

`.env.example` documents every variable. Two are required: `DATABASE_URL` and
`PAYLOAD_SECRET`. Leave the storage block commented out - uploads then go to
local disk, which is what you want locally.

**Use your own database.** Point `DATABASE_URL` at a database nobody else is
working in: a free Neon project, or Postgres in Docker. The next two steps
write schema and content to whatever it points at.

## 3a. Quickstart: your own database with demo content

From nothing to a site with something on every page:

```bash
cp .env.example .env         # fill in DATABASE_URL and PAYLOAD_SECRET
pnpm install
pnpm payload migrate         # build the schema
pnpm seed:demo               # fill it with demo content
pnpm create:admin            # first admin account, from BACKUP_ADMIN_* in .env
pnpm dev                     # http://localhost:3000, admin at /admin
```

`pnpm seed:demo` is safe to re-run - it matches documents on slug and updates
them rather than making duplicates.

### What the demo data is for

It is invented. No real member, photo or contact detail is in it, so nothing
that belongs to anyone ends up in a fork. The images are drawn at seed time,
labelled with their own dimensions, so a wrongly-scaled one is obvious.

It is also deliberately awkward, because a layout that has only seen tidy
content hides its bugs:

- **Both sides of every branch.** Events online and in person, past and
  upcoming, with and without a venue. Resources written in the CMS and linked
  out to YouTube, a PDF and a website. Simulators that open a site and ones
  that send you to a download. Members with and without a photo, a bio, an end
  year.
- **Strings that fight the layout.** A title that wraps three or four times
  next to a two-word one, a description sitting exactly on the 200-character
  card limit, a single unbroken 70-character token, and some non-ASCII text.
- **Images that fight the layout.** Ultra-wide, tall portrait, square, and one
  deliberately too small to fill its slot.

If something looks wrong after seeding, that is usually the point - it found a
real bug. Fix the layout rather than softening the demo data.

## 4. Database

The schema is **migration-managed** - never let dev mode "push" schema changes.

```bash
pnpm payload migrate        # apply all migrations in src/migrations/
```

First run creates every table. Then `pnpm create:admin` makes the first
account - the Users collection does not allow sign-ups, so the admin UI has no
"create account" screen.

A database built from these migrations is kept identical to production. If you
change the schema by hand anywhere, write a migration for it in the same
commit, or the next person to set up from scratch gets a schema the app cannot
run on. That happened twice and is what
`20260922_190000_reconcile_schema_drift` repairs.

### Changing the schema (collections/globals/fields)

1. Edit the collection/global in `src/payload/`
2. `pnpm generate:types` - regenerates `src/payload/payload-types.ts` (committed!)
3. `pnpm payload migrate:create <short_name>` - writes a migration
4. Review the generated SQL, then `pnpm payload migrate`
5. Commit the collection change + types + migration files **together**

Never edit an already-committed migration; add a new one.

## 5. Daily commands

| Command | What it does |
|---|---|
| `pnpm dev` | dev server at :3000 (frontend + `/admin`) |
| `pnpm verify` | **run before every commit** - biome lint + typecheck + integration tests |
| `pnpm verify:full` | everything: verify + production build + Playwright e2e |
| `pnpm check` | biome lint+format with auto-fix |
| `pnpm typecheck` | TypeScript only |
| `pnpm build:app` | production build without touching the DB |
| `pnpm build` | full production build (**runs DB migrations first** - deployment only) |
| `pnpm generate:types` | regenerate payload-types.ts after schema edits |

E2E tests boot their own dev server; make sure port 3000 is free. First run:
`pnpm exec playwright install chromium`.

## 6. Content model quick map

| Where | What |
|---|---|
| Collections | events, resources, tutorials, simulators, projects, forms, form-submissions, form-media, members (+roles/categories/photos), gallery, achievements, media, tags, users |
| Globals | About Page, Legal Pages, Support Pages, Home Featured Members |
| Native forms | Admin → Forms: author multi-step fields directly in Payload. Answers are stored in `form-submissions`, with optional idempotent mirroring to a configured Google Sheet. Forms can also accept image uploads stored in Google Drive. |
| Certificates | Forms can issue certificates immediately or on a schedule. The site tracks recipients and status; Google Apps Script creates the PDF from a Google Slides template and emails it. |

## 7. Deployment (Vercel)

- Push to `main` → auto-deploy. The build runs migrations against the prod DB.
- Required env vars in Vercel (Production): `DATABASE_URL` (via Neon
  integration), `PAYLOAD_SECRET`, `USE_S3_STORAGE=true`, `S3_ENDPOINT`,
  `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`.
- Optional: `GOOGLE_SITE_VERIFICATION` - the token from Search Console's
  "HTML tag" method, without the surrounding markup. Only needed while
  verifying a URL-prefix property; leave it set afterwards so a re-check
  never fails.
- `USE_S3_STORAGE` is deliberately NOT tied to NODE_ENV - local production
  builds (`pnpm build:app && pnpm start`) keep using local disk.

## 8. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Admin panel renders blank in prod build | importMap missing a component - `pnpm generate:importmap`, rebuild |
| `relation "..." does not exist` | migrations not applied - `pnpm payload migrate` |
| Payload asks "dev mode… data loss" on migrate | the DB was schema-pushed by dev mode once; answer yes once, stay migration-managed after |
| Images broken in prod build locally | expected - prod bucket media isn't on your disk; upload fresh test media |
| 400s on static chunks / client exception | stale server process serving an old build - kill node processes, rebuild, restart |
| e2e fails to start | port 3000 occupied - kill the old dev/prod server |

## 9. Rules for contributors (humans AND AI)

Read **AGENTS.md** before writing code. It defines the design language,
naming conventions, and hard bans. docs/PRODUCT.md and docs/DESIGN.md define the brand -
they are not suggestions.
