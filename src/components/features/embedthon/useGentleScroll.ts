'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { useEffect } from 'react'

/** The live Lenis instance, for code that needs to scroll the page itself. */
let current: Lenis | null = null

export function getGentleScroll(): Lenis | null {
  return current
}

/**
 * Wheel smoothing for the event pages.
 *
 * Lenis eases the page toward where the wheel wants it instead of jumping in
 * notches, which is what makes the scrubbed sections (the crest rising over the
 * hero, the brief words sliding in) feel slow and weighted. A low `lerp` is the
 * gentleness: each frame closes only a small slice of the remaining distance.
 *
 * It is driven from GSAP's own ticker, and every Lenis scroll updates
 * ScrollTrigger, so triggers read the eased position and scrub exactly with what
 * the reader sees. Touch scrolling stays native on purpose: the phone's own
 * momentum is already the right feel and fighting it makes the page feel heavy.
 * Visitors who ask for reduced motion keep ordinary scrolling.
 */
export function useGentleScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    gsap.registerPlugin(ScrollTrigger)

    const lenis = new Lenis({ lerp: 0.07, wheelMultiplier: 0.85, anchors: true })
    current = lenis
    lenis.on('scroll', ScrollTrigger.update)

    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    // Lenis already smooths motion; GSAP's catch-up after a slow frame would
    // make the scrubbed sections jump against it.
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      gsap.ticker.lagSmoothing(500, 33)
      lenis.destroy()
      current = null
    }
  }, [])
}
