# Design

## Theme

Dark-first with a light mode via `next-themes` (`.dark` class strategy). The scene: a student checking the club site on a phone in a dim electronics lab between classes — dark base, warm copper accents like solder under bench light. A subtle `fabric-of-squares` texture overlays surfaces site-wide; the home page adds an animated star-field.

**Color strategy: Committed** — copper carries identity across links, active states, badges, fills, and glows on a graphite-black base.

## Colors

Tokens are shadcn-style HSL triplets in `src/app/(frontend)/globals.css`.

### Dark (default experience)

| Role | Value | Notes |
|---|---|---|
| `--background` | `20 14.3% 4.1%` | graphite near-black (#0c0a09) |
| `--foreground` | `36 30% 96%` | warm off-white |
| `--primary` | `29 65% 57%` | **copper** #d98e4a — buttons, links, active nav, logo fill |
| `--primary-foreground` | `20 14.3% 4.1%` | near-black on copper |
| `--accent` | `29 40% 16%` | deep copper tint — hovers, selected surfaces |
| `--ring` | `29 65% 57%` | copper focus rings |
| `--border` | `29 20% 14%` | copper-tinted border instead of pure white/5 |

### Light

| Role | Value | Notes |
|---|---|---|
| `--background` | `36 30% 97%` | warm off-white |
| `--foreground` | `20 14.3% 8%` | near-black |
| `--primary` | `28 67% 38%` | deep copper #a05a20 (AA on light bg) |
| `--accent` | `29 50% 90%` | pale copper tint |

### Rules

- No raw hex in components — use tokens. Legacy hard-coded `#0070f3` / `rgba(0,112,243,…)` blues are replaced by `--primary` / copper rgba.
- Glows: copper at low alpha (`rgba(217,142,74,0.3)`), never blue.
- Body text ≥4.5:1 against background in both themes; `muted-foreground` is for metadata only, never paragraphs.

## Typography

| Use | Font | Source |
|---|---|---|
| Body / UI | ITC Avant Garde Std (XLt 200 / Md 500 / Bold 700) | `next/font/local`, `--font-avant-garde` |
| Display / logo lockups | Gobold Bold | `--font-gobold`, also inlined in SVG banners |
| Accent display | Sport Break | `--font-sport-break` |

- Page titles: uppercase, absolute-positioned top-left (`text-2xl` mobile → `text-4xl` desktop) — an established site signature.
- Body line-length ≤75ch; `text-wrap: balance` on headings.
- Display letter-spacing never tighter than `-0.04em`.

## Components

- **Shells**: `SidebarShell` (desktop sidebar nav + mobile menu + intro overlay) → `MainbarShell` (rounded content panel with its own scroll container). All frontend pages nest inside both.
- **Cards**: `CutoutCard` (cult-ui) is the standard content card for Resources/Tutorials — masked-corner cutout with inset label; `featured` and auto-`NEW` badges come from Payload. Gallery uses `Masonry`; events use carousel + focus cards.
- **Intro**: logo fill + banner slide choreography on first home load (`FrontendShell`), scales to viewport on mobile, gates page reveal and background audio.
- **Buttons**: shadcn `Button` + animate-ui `FlipButton` for icon toggles (theme, audio) — flip-on-hover from bottom.
- **Texture**: `BgImageTexture` overlay (`/fabric-of-squares.png`) across the frontend shell, blend-mode tuned per theme.
- Block-based CMS content rendered via `BlockRenderer` → text/code(shiki)/table/graph(mermaid)/image/row/simulator-link blocks.

## Layout

- Mobile-first: single column at ~390px, content panels edge-to-edge (borderless) on mobile.
- Desktop: fixed left sidebar, rounded main panel with internal scroll; theme + audio toggles top-right.
- Card grids: `repeat(auto-fit, minmax(280px, 1fr))` — no breakpoint ladders.
- Spacing rhythm varies: generous between sections (py-16+), tight inside groups.

## Motion

- Signature: intro logo fill → banner slide → content fade (motion/react). Runs once per home visit; `prefers-reduced-motion` gets instant reveal.
- Micro: FlipButton hover flips, card hover scale (1.05) + copper glow, tab underline spring.
- Ease-out expo/quart everywhere; no bounce.
- Mermaid diagrams and heavy libs load lazily — motion never blocks content.

## Anti-patterns (site-specific bans)

- Icon + heading + text card grids repeated per section.
- Tiny uppercase tracked kicker above every section; numbered 01/02/03 section markers.
- Blue-glow "tech" accents; gradient text; glassmorphism-by-default.
- Fixed pixel widths that overflow 390px viewports (the intro logo bug — since fixed).
