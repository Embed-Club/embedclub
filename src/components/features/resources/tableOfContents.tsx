'use client'

import type { RichTextHeading } from '@/lib/richTextHeadings'
import { useCallback, useEffect, useRef, useState } from 'react'

/** Indent per heading level, spelled out for Tailwind's JIT scanner. */
const LEVEL_INDENT: Record<number, string> = {
  2: '',
  3: 'ps-3',
  4: 'ps-6',
  5: 'ps-9',
  6: 'ps-12',
}

/**
 * Where the "you are here" line sits, as a fraction of the visible height. A
 * heading counts as current once it crosses this line.
 *
 * Half-height, not a small fixed offset: with the line near the top, a section
 * became current the instant its heading appeared, while the text being read
 * was still the previous section's. Reading happens around the middle of the
 * viewport, so that is where the line belongs.
 */
const ACTIVE_LINE_RATIO = 0.5

/**
 * How far above the advancing bar a node starts filling, in pixels. Mirrors the
 * achievements timeline's `fillDistance`, scaled down for a rail this size —
 * large enough that the fill reads as a sweep rather than a snap, small enough
 * that two adjacent nodes are not both mid-fill.
 */
const NODE_FILL_DISTANCE = 20

/**
 * "On this page" nav with a scroll-linked progress rail.
 *
 * Active tracking is position-based — the last heading scrolled past the
 * ACTIVE_LINE_RATIO line wins — rather than IntersectionObserver. Observers report each
 * heading independently, so two headings close together (a short section, or a
 * heading sitting right above a table's own header row) are both "intersecting"
 * and the active item flickers between them. Asking "which heading did I most
 * recently pass?" has exactly one answer at any scroll position, so it cannot
 * flicker regardless of how tightly headings are packed.
 *
 * Anchor ids come from `lib/richTextHeadings`, which also feeds the renderer,
 * so the links and the headings can't drift apart.
 *
 * The moving parts — bar width, percentage, rail height, node fills — are
 * written straight to the DOM from the scroll handler rather than held in
 * state. Routing them through `setState` re-rendered the whole nav on every
 * frame, and React schedules those renders on a task the browser happily
 * defers while a scroll gesture is in flight: the rail visibly froze mid-scroll
 * and snapped to the right value once the wheel stopped. Only `activeId` is
 * state, because it changes a handful of times per page rather than per frame.
 *
 * The rail height and node fills track `currentIndex`, interpolated against
 * the next heading's position — not the raw scroll `progress` the bar above
 * the nav uses. Sections vary wildly in length (a step with three screenshots
 * vs. one line of text), so raw scroll percentage and "which item is active"
 * disagree constantly; the interpolation is what makes the fill move smoothly
 * (like the achievements timeline's bar) while still landing on the same item
 * `activeId` highlights, instead of racing ahead of or lagging behind it.
 */
export function TableOfContents({ headings }: { headings: RichTextHeading[] }) {
  const [activeId, setActiveId] = useState<string | null>(headings[0]?.id ?? null)
  // Mirrors `activeId` so the scroll handler can compare against the current
  // value without taking it as a dependency and re-subscribing every change.
  const activeIdRef = useRef<string | null>(headings[0]?.id ?? null)

  const navRef = useRef<HTMLElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const nodeFillRefs = useRef<(HTMLSpanElement | null)[]>([])
  const barRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  const railRef = useRef<HTMLDivElement>(null)

  const measure = useCallback(() => {
    // The page scrolls inside ContentPanel, not the window — reading
    // window.scrollY here would return 0 forever.
    const scroller = document.querySelector('[data-scroll-container]')
    if (!scroller) return

    const scrollerTop = scroller.getBoundingClientRect().top

    // Progress is measured across the article only. The scroll container also
    // holds the full-viewport SiteFooter, so dividing by the container's own
    // scrollHeight caps the bar around 80% at the end of the actual reading —
    // the remainder is footer.
    const scope = document.querySelector('[data-toc-scope]')
    let progress: number
    if (scope) {
      const rect = scope.getBoundingClientRect()
      const readable = rect.height - scroller.clientHeight
      const scrolled = scrollerTop - rect.top
      progress = readable > 0 ? Math.min(1, Math.max(0, scrolled / readable)) : 1
    } else {
      const scrollable = scroller.scrollHeight - scroller.clientHeight
      progress = scrollable > 0 ? Math.min(1, Math.max(0, scroller.scrollTop / scrollable)) : 0
    }

    if (barRef.current) barRef.current.style.width = `${progress * 100}%`
    if (labelRef.current) labelRef.current.textContent = `${Math.round(progress * 100)}%`

    const activeLine = scroller.clientHeight * ACTIVE_LINE_RATIO

    // One DOM read per heading, reused below for both the active index and
    // the rail's fill fraction. A heading that is not in the DOM is pinned to
    // +Infinity so it never counts as "passed".
    const tops = headings.map((heading) => {
      const el = document.getElementById(heading.id)
      return el ? el.getBoundingClientRect().top - scrollerTop : Number.POSITIVE_INFINITY
    })

    let currentIndex = 0
    for (const [index, top] of tops.entries()) {
      if (top <= activeLine) {
        currentIndex = index
      } else {
        // Headings are in document order, so the first one still below the
        // line means every later one is too.
        break
      }
    }

    const current = headings[currentIndex]?.id ?? null
    if (current !== activeIdRef.current) {
      activeIdRef.current = current
      setActiveId(current)
    }

    // The rail fills to the active item, interpolated smoothly across the gap
    // to the next one — not to raw scroll percentage. Sections are wildly
    // uneven in length (a step with three screenshots vs. one line of text),
    // so tracking raw scroll made the rail disagree with which item was
    // actually highlighted as active. Tracking currentIndex alone was smooth
    // in principle but jumped a whole node the instant the active line
    // crossed a heading; interpolating against the *next* heading's position
    // fills that gap continuously while still landing on the right node.
    const nav = navRef.current
    if (!nav) return
    const currentTop = tops[currentIndex]
    const nextTop = tops[currentIndex + 1]
    const sectionFraction =
      currentTop === Number.POSITIVE_INFINITY
        ? 0
        : nextTop === undefined || !Number.isFinite(nextTop) || nextTop <= currentTop
          ? 1
          : Math.min(1, Math.max(0, (activeLine - currentTop) / (nextTop - currentTop)))
    const railFill =
      headings.length > 1
        ? (currentIndex + sectionFraction) / (headings.length - 1)
        : currentTop === Number.POSITIVE_INFINITY
          ? 0
          : 1
    if (railRef.current) railRef.current.style.height = `${railFill * 100}%`

    // Node fill, measured the way the achievements timeline measures it:
    // convert the rail's height back into pixels, then fill each node by how
    // far the bar has advanced past its centre. Items are not uniform height —
    // a two-line heading is taller — so distributing fill by index instead
    // would drift out of step with the bar it is supposed to be tracking.
    const navTop = nav.getBoundingClientRect().top
    const barBottom = railFill * nav.clientHeight

    for (const [index, item] of itemRefs.current.slice(0, headings.length).entries()) {
      const node = nodeFillRefs.current[index]
      if (!item || !node) continue
      const rect = item.getBoundingClientRect()
      const centre = rect.top - navTop + rect.height / 2
      const distance = centre - barBottom
      const fill =
        distance <= 0 ? 1 : distance <= NODE_FILL_DISTANCE ? 1 - distance / NODE_FILL_DISTANCE : 0
      node.style.clipPath = `inset(${(1 - fill) * 100}% 0 0 0)`
    }
  }, [headings])

  useEffect(() => {
    if (headings.length === 0) return
    const scroller = document.querySelector('[data-scroll-container]')
    if (!scroller) return

    // rAF-throttled: scroll fires far more often than we can usefully paint,
    // and each pass reads layout for every heading.
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        measure()
      })
    }

    measure()
    scroller.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      scroller.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [headings, measure])

  if (headings.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-border">
          {/* No width transition: this is written every frame, so an easing
              curve would only ever be chasing a value that already moved. */}
          <div ref={barRef} className="h-full w-0 rounded-full bg-primary" />
        </div>
        <span ref={labelRef} className="tabular-nums text-xs text-muted-foreground">
          0%
        </span>
      </div>

      {/* The rail is a scaled-down copy of the achievements timeline: an
          outlined capsule that a solid bar grows down, with a node per entry
          that fills as the bar reaches it. Copper (`--primary`) replaces that
          page's black-on-light / white-on-dark treatment, so the rail reads the
          same way in both colour modes instead of inverting. */}
      {/* No padding on the nav. An absolute `left` resolves against the padding
          box's outer edge, but the links below are in normal flow and start
          inside the padding — so padding here offsets the track from the nodes
          by exactly that amount. With none, `left-1.5` means the same x for the
          track, the fill and every node. */}
      <nav ref={navRef} className="relative flex flex-col gap-0.5" aria-label="On this page">
        <div
          className="absolute inset-y-0 left-1.5 w-1.5 -translate-x-1/2 rounded-full border border-primary/40"
          aria-hidden
        />
        {/* No height transition, same reasoning as the bar above it: this is
            written every frame from the scroll handler, so an easing curve
            would only ever be chasing a value that already moved. */}
        <div
          ref={railRef}
          className="absolute left-1.5 top-0 h-0 w-[3px] -translate-x-1/2 origin-top rounded-full bg-primary"
          aria-hidden
        />

        {headings.map((heading, index) => {
          const isActive = activeId === heading.id
          return (
            <a
              key={heading.id}
              ref={(el) => {
                itemRefs.current[index] = el
              }}
              href={`#${heading.id}`}
              aria-current={isActive ? 'location' : undefined}
              className={`relative block py-1.5 ps-5 text-sm leading-snug transition-colors duration-200 ${
                isActive
                  ? 'font-medium text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {/* Node: outlined ring on the page background, with a solid disc
                  clipped in from the top as the bar arrives. */}
              <span
                aria-hidden
                className="absolute left-1.5 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2"
              >
                <span className="absolute inset-0 rounded-full border border-primary/40 bg-background" />
                <span
                  ref={(el) => {
                    nodeFillRefs.current[index] = el
                  }}
                  className="absolute inset-0 rounded-full bg-primary"
                  style={{ clipPath: 'inset(100% 0 0 0)' }}
                />
              </span>
              {/* Sub-heading indent lives on an inner block, not on the link:
                  putting it on the link would collide with its own `ps-5` (two
                  padding-inline-start utilities, one silently winning) and, if
                  it did apply, would drag the node off the rail with it. */}
              <span className={`block ${LEVEL_INDENT[heading.level] ?? ''}`}>{heading.text}</span>
            </a>
          )
        })}
      </nav>
    </div>
  )
}
