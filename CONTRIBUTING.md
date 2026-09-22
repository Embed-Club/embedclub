# Contributing

Anyone in the club can work on this site. You do not need permission to start
and you do not need production access - you run the whole thing on a database
of your own.

If you only read one other file, make it **[AGENTS.md](AGENTS.md)**. It defines
the design language, the naming conventions and the rules that are not up for
negotiation. It applies to humans and to any AI coding assistant you use. Most
changes that get sent back are sent back because they contradict it.

## Setting up

```bash
git clone https://github.com/Embed-Club/embedclub.git
cd embedclub
pnpm install

cp .env.example .env    # fill in DATABASE_URL and PAYLOAD_SECRET
pnpm payload migrate    # build the schema
pnpm seed:demo          # fill it with demo content
pnpm create:admin       # first admin account, from BACKUP_ADMIN_* in .env

pnpm dev                # http://localhost:3000  (admin at /admin)
```

Use a database nobody else is working in - a free [Neon](https://neon.tech)
project or Postgres in Docker. Never point `DATABASE_URL` at the club's
production database while developing: content you create there is live
immediately, and a migration run from your machine hits the real schema.

Leave the storage block in `.env` commented out. Uploads then go to local disk,
which is what you want. Full detail in **[docs/SETUP.md](docs/SETUP.md)**.

## The demo dataset

`pnpm seed:demo` is invented content - no real member, photo or contact detail,
and its images are drawn at seed time rather than committed.

It is deliberately awkward. It covers both branches of every conditional field
(events online and in person, resources written here and linked elsewhere,
simulators that open a site and ones that download), titles that wrap four
times beside two-word ones, a description sitting exactly on the 200-character
card limit, an unbroken 70-character token, and images from ultra-wide to tall
portrait.

So if a page looks wrong after seeding, that is usually the point: it found a
real bug. Fix the layout rather than softening the demo data. Re-running the
seed is safe, it updates documents in place instead of duplicating them.

## Making a change

```bash
git checkout -b feat/short-description   # never work on main
# ... make your change ...
pnpm verify                              # before every commit
pnpm verify:full                         # before opening the PR
```

Open a pull request against `main` saying what changed and why. Never push
straight to `main`: it auto-deploys and runs migrations against the production
database.

Branch prefixes in use: `feat/`, `fix/`, `docs/`, `chore/`.

Write commit messages that say what changed and why it needed changing. "fix
footer" tells the next person nothing; "keep the footer profile links on one
line at tablet widths" tells them what to look for when it breaks again.

## What reviewers look for

- **`pnpm verify` passes** - Biome, TypeScript, integration tests. No `as any`,
  `@ts-ignore`, `ignoreBuildErrors` or lint suppressions without a written
  reason in a comment next to them.
- **camelCase file and folder names** - `resourceCutoutCard.tsx`, not
  `resource-cutout-card.tsx`. Exported components stay PascalCase inside the
  file. The `shadcn` CLI emits kebab-case; rename after adding one.
- **No page copy in JSX** - content lives in Payload. If you need a new field,
  extend the collection rather than hardcoding the text.
- **Plain hyphens** - use `-`. The em dash and en dash are banned everywhere:
  page copy, CMS content, comments, commit messages, docs.
  `scripts/replaceEmDashes.ts` sweeps the database if one gets in.
- **Design tokens only** - colours come from `hsl(var(--primary))` and friends
  in `globals.css`. No new hex values, no new accent hues, no gradients as
  decoration. See [docs/DESIGN.md](docs/DESIGN.md).
- **Both themes and three widths** - check light and dark, and at phone, tablet
  and desktop. Several bugs in this repo were visible at exactly one width.
- **Dependencies justified** - say in the PR why a new package earns its place.

## Working on the database schema

Migrations are the only source of truth for the schema. A change applied by
hand and never written down means the next person setting up from scratch gets
a database the app cannot run on. That has already happened twice, and
`src/migrations/20260922_190000_reconcile_schema_drift.ts` is what repairs it.

A schema change is four things in one commit:

1. Edit the collection or global in `src/payload/`.
2. `pnpm generate:types` - regenerates `src/payload/payload-types.ts`, which is
   committed. Never hand-edit it.
3. Write a migration in `src/migrations/`. Never edit one already committed;
   add a new one.
4. Apply it and check it worked.

Before you open the PR, prove a fresh database still matches production: run
the migrations against an empty database and diff the two schemas. If they
differ, your migration is incomplete.

## Where things live

| You want to change...         | Look in                                          |
| ----------------------------- | ------------------------------------------------ |
| A page's layout               | `src/app/(frontend)/<route>/`                    |
| A reusable component          | `src/components/common/` or `features/<domain>/` |
| The app shell, nav or footer  | `src/components/layout/`                         |
| What editors can enter        | `src/payload/collections/` or `globals/`         |
| Colours, fonts, spacing       | `src/app/(frontend)/globals.css`                 |
| Demo content for local work   | `scripts/seedDemo.ts`                            |
| Schema history                | `src/migrations/`                                |

Adding a page means adding it to **both** `layout/desktopMenu.tsx` and
`layout/mobileMenu.tsx`, and to `src/app/sitemap.ts` unless it is meant to stay
unlisted.

## Reporting something broken

Open an issue with what you did, what you expected, and what happened. Include
a screenshot at the width you saw it - several of the bugs fixed so far were
only visible at one screen size, and a description of them read as "the footer
looks fine to me".

## Licence

Contributions are made under the MIT licence in [LICENSE](LICENSE). Note that
the club's logo and brand assets are excluded from it: do not add anything to
the repo that you do not have the right to publish under those terms, fonts
especially.
