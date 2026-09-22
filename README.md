# Embed Club | P.A. College of Engineering

<div align="center">
  <img src="public/EmbedClubBanner-Dark.svg" alt="Embed Club Logo" width="600" />
  <p align="center">
    <strong>A student-led self-learning club dedicated to Embedded Systems and IoT at PACE</strong>
  </p>

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Payload CMS](https://img.shields.io/badge/Payload-3.0-blue?style=for-the-badge&logo=payloadcms)](https://payloadcms.com/)
[![PostgreSQL](https://img.shields.io/badge/Neon-PostgreSQL-green?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Supabase](https://img.shields.io/badge/Supabase-S3_Storage-emerald?style=for-the-badge&logo=supabase)](https://supabase.com/)

</div>

## About Us

Welcome to the IoT and Embedded Systems Club at **P.A. College of Engineering**. We are a group of passionate students and tech enthusiasts who share a common interest in embedded systems, IoT, and computer science. Our club provides a platform for students to explore, experiment, and create with technology through events, workshops, and projects.

### Foundational Team & Alumni

Embed Club emerged from the collective vision of its founding Members: **Habeeb Ur Rehman**, **Nishant Narayanan**, and **Mohammed Saifuddin**. Our alumni play a vital role, leveraging industry experience to train current students in advanced technologies through workshops and mentorship.

Embedded system education is a challenge because it sits at the intersection of many disciplines. Embed Club is planned and managed by the students themselves, ensuring we stay close to industry requirements while learning consciously and actively.

### History

Embed Club was inaugurated on **14th November 2018 at PACE**. The club was founded with these core objectives:

- **Infrastructure**: Creating a community with infrastructure to help technical minds.
- **Knowledge Transfer**: Connecting experienced mentors and newbies to transfer knowledge.
- **Innovation**: Connecting like-minded technocrats to generate ideas, products, and technologies.
- **Open Lab**: Creating an Open Lab with the latest hardware and tools through community contributions.

### Activities

To meet the requirements from research and industry, we focus on six types of activities:

1.  **Discussion**: Sharing experiences among students to form a technology community.
2.  **Training**: Hands-on sessions to master knowledge consciously and actively.
3.  **Lecture**: Supplements to class, featuring specialists and senior engineers.
4.  **Project**: Collaborative work on real-world engineering challenges.
5.  **Contest**: Participating in and hosting technical competitions.
6.  **Research**: Opportunities for senior members to join advanced research groups.

---

## Project Overview

**Embed Club** is the IoT and Embedded Systems Club at **P.A. College of Engineering (PACE)**. We are a community of student tech enthusiasts dedicated to self-learning, collaboration, and hands-on innovation in the fields of embedded systems and computer science.

### Mission

We are dedicated to advancing knowledge and expertise in embedded systems and IoT. Our mission is to foster a community of passionate learners and innovators who collaborate, create, and make a positive impact through technology.

### Vision

Our vision is to be a leading hub for innovation in embedded systems and IoT. We aim to inspire and educate the next generation of engineers and problem solvers who will shape the future of technology.

### Get Connected!

Embed Club connects over **100+ Members** who share a passion for embedded systems and innovation. Collaborate on groundbreaking projects, host tech events, and network with professionals in fields like Embedded AI, Real-time Systems, and IoT. Join us and be a part of something big!

## Project Structure

```text
/docs         - SETUP, DESIGN, PRODUCT, CHANGELOG
/public       - Static assets (fonts, brand logos, MicroPython runtimes)
/scripts      - Seed and maintenance scripts, run with pnpm tsx
/tests        - Vitest integration tests and Playwright e2e
/src
  /app        - Next.js 15 App Router (frontend + Payload admin)
  /components - Reusable React components and layouts
  /payload    - Payload config, collections and globals
  /migrations - Migration-managed schema history - never edit a committed one
  /lib        - Shared utilities and type-safe helpers
  /hooks      - Custom React hooks
```

### High-Fidelity Features

- **Intro Visual Identity**: A specialized **Shared Element Transition** (Logo Glide) that persists across page loads for a premium "App-like" feel.
- **"Solder & Copper" design system**: copper-on-graphite theme with a fabric texture, documented in `docs/DESIGN.md` / `docs/PRODUCT.md`.
- **Native Form Builder**: multi-step wizard forms built in Payload admin; submissions are stored in Payload and can be mirrored idempotently to Google Sheets.
- **Automated Media Engine**: Integrated **Sharp-powered responsive image generation** with local development storage and optional Supabase S3 storage in production.
- **Relational Directory**: Sophisticated member profiles with hierarchical roles, categories, and achievement tracking.
- **Resource Hub**: A curated repository of tools, tutorials, and simulators with advanced tagging, search, and cutout-card UI.
- **Event Orchestration**: Full lifecycle management for workshops, meetings, and club activities - with optional registration and feedback forms.
- **Certificates**: Immediate or scheduled certificate delivery backed by Google Slides, Google Drive, Google Apps Script, and per-recipient tracking.

---

## Architecture & Tech Stack

| Layer           | Technology                   | Purpose                                               |
| :-------------- | :--------------------------- | :---------------------------------------------------- |
| **Frontend**    | Next.js 15 (App Router)      | Core application routing and SSR/ISR                  |
| **Backend/CMS** | Payload CMS 3.82             | Headless content management & local API               |
| **Database**    | Neon (PostgreSQL)            | Serverless relational database, migration-managed     |
| **Storage**     | Local disk / Supabase S3     | Local by default; S3-compatible storage when enabled |
| **Motion**      | Motion (motion/react) & GSAP | High-fidelity UI animations and transitions           |
| **Styling**     | Tailwind CSS 3               | Copper design tokens + utility layout                 |

## Deployment

This project is optimized for deployment on Vercel or similar platforms.

### Build Process

The build command in `package.json` includes critical steps for Payload 3.x:

1.  **Database Migrations**: `pnpm run payload migrate` runs automatically to sync the database schema.
2.  **Import Map Generation**: `pnpm run generate:importmap` creates the component mappings required for the Admin Panel.
3.  **Next.js Build**: Standard `next build` for the application.

### Environment Variables

Every variable is documented in **[.env.example](.env.example)**. Locally you
need two: `DATABASE_URL` and `PAYLOAD_SECRET`. Production additionally sets
`USE_S3_STORAGE=true` with the `S3_*` values, `NEXT_PUBLIC_SITE_URL`,
`NEXT_PUBLIC_SUPABASE_MEDIA_URL`, and the Google service-account variables for
the Sheets, Drive and certificate integrations.

Values are never hardcoded as defaults or fallbacks, not even non-secret ones.
If something is missing in an environment, set it there.

## Getting Started

You need **Node 20.9+**, **pnpm 9 or 10**, and a **Postgres database of your
own** - a free [Neon](https://neon.tech) project or Postgres in Docker. You do
not need the club's production database, and you should not use it.

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

Full instructions, the content model, deployment and troubleshooting live in
**[docs/SETUP.md](docs/SETUP.md)**.

### The demo dataset

`pnpm seed:demo` gives you a site with something on every page. It is invented
content - no real member, photo or contact detail - and its images are drawn at
seed time rather than committed.

It is deliberately awkward, because a layout that has only seen tidy content
hides its bugs. It covers both branches of every conditional field (events
online and in person, resources written here and linked elsewhere), titles that
wrap four times beside two-word ones, a description sitting exactly on the
200-character card limit, an unbroken 70-character token, and images from
ultra-wide to tall portrait.

If a page looks wrong after seeding, that is usually the point. Fix the layout
rather than softening the demo data. Re-running the seed is safe - it updates
documents in place instead of duplicating them.

### Daily commands

| Command               | Purpose                                                          |
| --------------------- | ---------------------------------------------------------------- |
| `pnpm dev`            | dev server at :3000, admin at /admin                             |
| `pnpm verify`         | biome + typecheck + integration tests - run before every commit  |
| `pnpm verify:full`    | verify + production build + Playwright e2e - run before merging  |
| `pnpm generate:types` | regenerate Payload types after a collection or global changes    |
| `pnpm seed:demo`      | fill an empty database with demo content                         |
| `pnpm create:admin`   | create the first admin user - there is no sign-up screen         |
| `pnpm payload migrate`| apply migrations in `src/migrations/`                            |

## Contributing

Anyone in the club can work on this site, and you do not need production access
to start. **[CONTRIBUTING.md](CONTRIBUTING.md)** has the whole thing: setting
up, what reviewers look for, how schema changes work, and where in the tree to
find the thing you want to change.

The short version:

1. Read **[AGENTS.md](AGENTS.md)** - design language, naming, hard rules. It
   applies to humans and to any AI coding assistant you use.
2. Branch from `main`: `git checkout -b feat/short-description`
3. `pnpm verify` before every commit, `pnpm verify:full` before the PR.
4. Never push straight to `main` - it auto-deploys and migrates production.

## Licence

Source code is MIT, see **[LICENSE](LICENSE)**. The Embed Club logo, wordmark
and banner are excluded and remain the club's - replace them with your own
before publishing anything built on this code. Bundled fonts keep their own
licences.

---

<p align="center">
  Built with ❤️ by the Embed Club Engineering Team.
</p>
