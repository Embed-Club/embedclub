# Changelog & Working Record

What this site is, how it is built, and what has changed. Read alongside
[PRODUCT.md](PRODUCT.md) (brand strategy), [DESIGN.md](DESIGN.md) (visual
system), [SETUP.md](SETUP.md) (environment and migrations), and
[../AGENTS.md](../AGENTS.md) (hard rules).

---

## What the site is

The public website for **Embed Club**, an embedded-systems student club. It
exists so members can show what the club does and so students can find things:
upcoming events, past achievements, learning material, tools, member projects,
and photos.

Every page is content-managed. Nothing that a club officer might reasonably
want to change lives in JSX — it lives in Payload. Officers are students, they
rotate yearly, and none of them should need a developer to add an event.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| CMS | Payload 3 |
| Database | Postgres (Neon), migration-managed, `push: false` |
| Media | Supabase Storage, served via CDN rewrite |
| Styling | Tailwind 3 + shadcn primitives |
| Animation | `motion` (never framer-motion), gsap |
| Tooling | pnpm, Biome (not ESLint/Prettier), Vitest, Playwright |

## Design language, in one paragraph

**"Solder & Copper"** — copper (`#d98e4a` dark / `#a05a20` light) on graphite
or warm white, with a fabric-of-squares texture on panels. Fonts are ITC Avant
Garde for body and Gobold + Sport Break for display. The signature UI object is
the **cutout card**: notched corners, an inset label strip, an image that zooms
on hover. Colors only ever come from CSS tokens. Full rules, including the list
of banned patterns, are in [DESIGN.md](DESIGN.md) and AGENTS.md §1.

### A thing that looks like a bug and is not

Sidebar and mobile nav labels read `HOE`, `EENTS`, `CHIEEENTS`, `SIULTORS`.
These are **not** typos and not missing letters. The display font maps
private-use Unicode codepoints (U+E000 and friends) to its `A`, `M`, and `V`
glyphs, so the source strings contain those codepoints rather than ASCII
letters. A label with no A/M/V — `PROJECTS`, `RESOURCES` — is plain ASCII.
Never "fix" these strings, and never retype one by hand without copying the
existing pattern.

---

## Content model

Admin nav is grouped so a new officer can find things:

| Group | Collections |
|---|---|
| **Content** | Events, Achievements, Gallery, Resources, Tutorials, Simulators, Projects |
| **Members** | Members, Member Roles, Member Categories, Member Photos |
| **Forms** | Forms, Form Submissions |
| **Library** | Media, Tags |
| **System** | Users |
| **Pages** (globals) | About Page, Home · Featured Members |

Notes on specific collections:

- **Resources / Tutorials / Simulators / Projects** are `orderable: true`.
  Drag rows in the admin list view; the site renders that order, top row first.
  No date sorting. This writes a fractional-index `_order` column.
- **Gallery** is an upload collection — one document per photo, holding the
  file itself plus a caption. Drag many files onto the list view to bulk upload.
- **Simulators** link out to someone else's site. Clicking a card opens a modal
  with an optional walkthrough video and a launch button, rather than
  navigating away immediately.
- **Users** cannot be created or deleted from the admin panel. Accounts are
  provisioned with `pnpm create:admin` (see below).

---

## Operational notes

### Adding an admin account

`users` has `create: () => false`, so the panel offers no "create user" button.
To add or reset one:

```bash
pnpm create:admin
```

Reads `BACKUP_ADMIN_EMAIL` and `BACKUP_ADMIN_PASSWORD` from the environment and
uses `overrideAccess: true` to bypass the lock. Never commit those values.

### Migrations

Schema is migration-managed. The workflow is in SETUP.md §4. Two cautions:

1. **Local `.env` points at the production database.** `pnpm build` runs
   migrations — use `pnpm build:app` for local verification builds.
2. `payload migrate:create` needs an interactive TTY and will ask
   create-vs-rename for every new enum and table. Recent migrations in this
   repo were hand-written, modelled on the existing DDL for a sibling
   collection. Whichever route you take, dry-run first: execute the `up` SQL
   inside a transaction and `ROLLBACK` before applying for real.

---

## Change history

### 2026-07-28 — Forms become the real thing

Forms stop mirroring a Google Form and become the system of record.
Migrations `20260728_140000` and `20260728_150000`.

**Google Forms dependency removed**

- `googleFormUrl` and every field's hand-copied `googleEntryId` are gone. That
  was the most error-prone step an officer had, and Google answers `200` even
  when the entry IDs are wrong — so a typo silently sent responses nowhere and
  the old `googleForwardStatus` reported success regardless.
- Answers are keyed by each field row's Payload `id`, which survives label
  edits. `answersByLabel` keeps a copy against the wording at submit time so
  exports stay readable after questions are reworded.

**Certificates**

Two delivery modes on the form: *straight after they submit*, or *email
everyone at a set time*. Both are **rolling** — dispatch picks up whoever is
`pending` right now, so someone who submits the morning after the send time
still gets theirs on the next pass. Status is per recipient
(`pending`/`sent`/`failed` + `certificateError`), so a failure retries without
re-sending to people who already received one. There is deliberately no
review-before-send step: names are printed as typed.

Server-side rendering in `lib/certificate.ts` mirrors the browser generator so
the emailed and downloaded certificates are identical. Sending runs through
`lib/mailer.ts` (SMTP, env-only) and the hourly `/api/cron/certificates` route,
guarded by `CRON_SECRET`. Immediate sends go out via `after()` so a slow SMTP
hop never makes a student wait or costs them their submission.

**Event ↔ form link reversed**

`events.registrationForm` is dropped in favour of `forms.relatedEvent`. Events
exist long before their forms do, so pointing the other way meant going back to
edit the event afterwards. Events surface theirs through a read-only `join`
field, which needs no column and cannot drift.

**Feedback**

The `feedback-page` global is gone. Feedback is now the Forms listing filtered
to `type: 'feedback'` — both pages share `formsListing.tsx` and the cutout
`formCutoutCard`.

**Hardening**

Honeypot field, per-form rate limit, and dedupe by email (a second submission
replaces the first, so nobody gets two certificates). Certificate forms now
refuse to save without exactly one `name` and one `email` role — caught at
edit time rather than at send time, when the event is already over.

**Optional Google Sheets mirror**

One spreadsheet **per form** (`forms.sheetId`, accepts a pasted URL). Because a
sheet holds a single form's responses, columns are that form's questions rather
than a JSON blob. Headers are matched by text and new questions are appended as
new columns, so editing a form cannot change what an older row's columns mean.
Idempotent — a row is only marked synced once written, and the submission id
leads every row. Auth is a service-account JWT signed with `node:crypto`, so no
Google SDK dependency. Entirely inert without credentials.

Before reaching for this: `form-submissions` is now wired into the
import/export plugin, so CSV/JSON export works from the admin list view with no
Google setup at all.



### 2026-07-28 — Admin cleanup and content-model overhaul

A five-part pass to make the admin panel navigable for non-technical officers.
Migrations `20260728_100000` through `20260728_130000`.

**Removed**

- **Audio + Audio Files collections**, and the `audioSliderField` admin
  component. Nothing ever read them — the home page's background music is the
  static `/Home.m4a` asset played by `backgroundAudio.tsx`, which is untouched
  and still has its toggle. Both tables held zero rows.
- **Resources `featured` checkbox** — a dead field, rendered nowhere. The
  `badge` select (which does render, and includes a "Featured" option) stays.
- **Resources `type` select** — replaced by a real Tutorials collection.
- **Resources `lastUpdated` date** — "Last updated" now reads Payload's own
  `updatedAt`, so it cannot drift from reality.
- **Simulators `category`** — the search bar hides its category filter when a
  collection has none.

**Added**

- **Tutorials collection**, splitting what used to be `resources.type`.
  Identical document shape, so both are built from one field factory
  (`learningFields.ts`) over a shared block palette (`contentBlocks.ts`).
- **Projects collection** and `/projects` page — member builds, with a status
  (planned / in progress / completed), the team who made it, and links to
  source or a demo. Added to the sidebar and mobile nav.
- **Simulator modal** with video support. `simulatorVideo.tsx` normalizes
  YouTube, youtu.be, Shorts, and Vimeo links to embeds, and falls back to a
  `<video>` element for direct file links.
- **Manual ordering** on Resources, Tutorials, Simulators, Projects, Gallery.
- **Description length caps** (200 chars) on Resources, Tutorials, Simulators,
  Projects, and the Events card tagline — the UI clamps to two lines.
- **`pnpm create:admin`** script, and the user-creation lockdown it exists for.

**Changed**

- **Gallery** went from one document holding an array of Media picks to an
  upload collection, one document per photo. This is what makes bulk upload
  possible. The 32 existing photos migrated by copying their Media rows' upload
  columns; because gallery shares the bucket root and image sizes with `media`,
  the already-generated derivative files still resolve and nothing was
  re-uploaded. **Consequence:** a migrated gallery document and its original
  Media document point at the same object in the bucket — deleting one deletes
  the shared file.
- **Simulator cards** moved onto the cutout design, matching resources.
- **Events carousel card** moved onto the cutout design — it was the last
  holdout, using `rounded-3xl` (which also broke the "no radius > 16px on
  cards" rule in AGENTS.md §1), a pill "New" badge, and a gradient title
  overlay instead of the notched inset strip.
- **Simulator slugs** auto-generate and are read-only.
- `iframeUrl` → `launchUrl` on Simulators; simulators are launched, not embedded.

**Known gaps after this pass**

- The one existing Wokwi simulator has no `launchUrl` (its old `iframeUrl` was
  null). The modal shows a "no link yet" message until an organizer adds one.
- Every card surface is now on the cutout system. `FocusCards` (events grid)
  and `ChromaGrid` (members) already were — they compose `CutoutCorner` and the
  notched inset label directly rather than importing the full `CutoutCard`
  root, which makes it easy to misread the imports and think otherwise.
- Forms and Feedback were deliberately deferred: the plan is to build forms in
  the CMS and push them to Google Forms, rather than mirroring a Google Form by
  hand. `form-submissions` (0 rows) is slated for removal, which needs
  AGENTS.md §3 updated first — that rule currently forbids it.
