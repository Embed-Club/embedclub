# Product

## Register

brand

## Users

Engineering students at PACE (Mangalore) — current Embed Club members, prospective members, and alumni. Mostly **mobile users** browsing between classes: checking upcoming events, reading tutorials/resources, trying embedded-systems simulators, submitting workshop feedback. A secondary audience is faculty and industry guests evaluating the club.

## Product Purpose

Embed Club's public face: showcase the club (est. 2018, "Inspiring Innovation"), publish events and gallery, host learning resources/tutorials with interactive simulators, manage member profiles and achievements, and collect workshop feedback with downloadable certificates. Content is managed by club admins through Payload CMS; success = students actually reading resources and showing up to events.

## Brand Personality

Hands-on, technical, workshop-bench. The club solders real boards — the site should feel like the lab, not like a SaaS product. Three words: **crafted, electric, student-built**. Custom display fonts (Gobold, Sport Break), an animated logo intro, background music, and a star-field home give it personality; the visual language should feel deliberately made by the members, never templated.

## Anti-references

- Generic AI-generated landing pages: icon-card grids, tiny uppercase tracked kickers over every section, 01/02/03 numbered scaffolding (the old About page had all of these — removed on purpose).
- Dev-tool SaaS look (Vercel/Linear clones): pure black/white with electric-blue accents.
- Terminal/matrix green hacker aesthetic.

## Design Principles

1. **The lab is the brand** — materials and colors come from real electronics: copper traces, solder, graphite PCBs. Not from tech-startup convention.
2. **Mobile is the primary device** — every layout decision is judged on a ~390px screen first; desktop is the enhancement.
3. **Content outlives code** — page content (About, Feedback, Resources) lives in Payload CMS so club officers can edit without a developer.
4. **Motion earns its place** — the intro logo choreography is the signature moment; everything else stays quick and functional.
5. **Student-built pride** — quirks (background music, custom cursor, star-field) are features of identity, kept polished rather than sanded off.

## Accessibility & Inclusion

- WCAG AA contrast for body text (≥4.5:1) in both light and dark themes.
- `prefers-reduced-motion` honored for intro animation and reveals.
- Background audio must never autoplay louder than ambient (0.15 volume) and always has a visible mute toggle.
- Touch targets ≥44px on mobile navigation.
