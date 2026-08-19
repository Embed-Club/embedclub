'use client'

import { useCallback, useLayoutEffect, useRef } from 'react'

/**
 * Grows a modal panel out of the card that opened it, and plays it back on
 * close.
 *
 * The panel is scaled per axis from the card's box to its own while an inner
 * wrapper is scaled by the inverse, so the two cancel and the content keeps its
 * true proportions while only the frame changes shape. Everything runs on
 * `transform` and `opacity`, which are composited - no layout or paint per
 * frame. Animating width/height instead is the obvious way to write this and is
 * the reason such modals stutter on cheap phones.
 *
 * Uses the Web Animations API rather than an animation library: motion's
 * imperative `animate()` drives values from JavaScript on rAF and, on these
 * elements, jumped straight to the end state - the modal simply appeared.
 *
 * Attach the refs like this, and give the panel `opacity: 0` inline so nothing
 * flashes at full size before the first frame:
 *
 *     <div ref={panelRef} style={{ opacity: 0 }}>   // the modal surface
 *       <div ref={innerRef} className="h-full w-full">
 *         <div ref={bodyRef}>…</div>                 // fades in behind it
 *       </div>
 *     </div>
 */

const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)'
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)'
const DURATION = 320

interface FlipFrom {
  x: number
  y: number
  scaleX: number
  scaleY: number
}

export interface UseCardMorphOptions {
  /** The clicked card's box. Without one the modal just appears. */
  originRect?: DOMRect | null
  /** Called once the closing animation has played. */
  onClose: () => void
  /** Skips the animation, for `prefers-reduced-motion`. */
  reduceMotion?: boolean | null
}

export function useCardMorph({ originRect, onClose, reduceMotion }: UseCardMorphOptions) {
  const panelRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const flipRef = useRef<FlipFrom | null>(null)
  const closingRef = useRef(false)

  useLayoutEffect(() => {
    const panel = panelRef.current
    const inner = innerRef.current
    const body = bodyRef.current
    if (!panel || !inner) return

    // A hidden page does not tick: the animation would be created and report as
    // running while currentTime stays at 0, holding the panel at card size
    // until the tab is looked at again. Open plainly instead.
    if (!originRect || reduceMotion || document.visibilityState !== 'visible') {
      panel.style.opacity = '1'
      return
    }

    const box = panel.getBoundingClientRect()
    if (box.width === 0 || box.height === 0) {
      panel.style.opacity = '1'
      return
    }

    // Anything still attached from a previous open. Closing one card and
    // opening another remounts the modal, but React reuses the DOM nodes, so
    // the old close animation survives and fights the new opening one.
    for (const el of [panel, inner, body]) {
      if (el) for (const a of el.getAnimations()) a.cancel()
    }

    // Top-left origin on both, so the maths is a plain corner-to-corner offset
    // rather than a centre offset that has to account for each scale.
    const flip: FlipFrom = {
      x: originRect.left - box.left,
      y: originRect.top - box.top,
      scaleX: Math.max(0.05, originRect.width / box.width),
      scaleY: Math.max(0.05, originRect.height / box.height),
    }
    flipRef.current = flip

    panel.style.transformOrigin = '0 0'
    inner.style.transformOrigin = '0 0'
    panel.style.opacity = '1'
    // Hinted for the move only; a permanent `will-change` keeps a compositor
    // layer alive and costs memory on the devices this is meant to help.
    panel.style.willChange = 'transform'
    inner.style.willChange = 'transform'

    // `backwards`, not `both`: both holds the first keyframe after the end as
    // well, so an interrupted opening leaves the panel stuck at card size.
    const options: KeyframeAnimationOptions = {
      duration: DURATION,
      easing: EASE_OUT,
      fill: 'backwards',
    }

    const panelAnim = panel.animate(
      [
        {
          transform: `translate(${flip.x}px, ${flip.y}px) scale(${flip.scaleX}, ${flip.scaleY})`,
        },
        { transform: 'translate(0px, 0px) scale(1, 1)' },
      ],
      options,
    )

    const innerAnim = inner.animate(
      [
        { transform: `scale(${1 / flip.scaleX}, ${1 / flip.scaleY})` },
        { transform: 'scale(1, 1)' },
      ],
      options,
    )

    // Held back and faded in once the frame is most of the way there. Revealing
    // it from the first frame is what makes a morph read as a squashed
    // screenshot rather than a container opening.
    const bodyAnim = body?.animate(
      [
        { opacity: 0, transform: 'translateY(8px)' },
        { opacity: 1, transform: 'translateY(0px)' },
      ],
      { duration: DURATION * 0.55, delay: DURATION * 0.45, easing: EASE_OUT, fill: 'backwards' },
    )

    Promise.all([panelAnim.finished, innerAnim.finished]).then(
      () => {
        panel.style.willChange = 'auto'
        inner.style.willChange = 'auto'
      },
      () => {},
    )

    return () => {
      panelAnim.cancel()
      innerAnim.cancel()
      bodyAnim?.cancel()
    }
  }, [originRect, reduceMotion])

  /**
   * Play the panel back into the card, then unmount.
   *
   * Every close path goes through here, so the modal always leaves the way it
   * arrived. Guarded, because the button, Escape and an outside click can all
   * fire before the animation finishes.
   */
  const requestClose = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true

    const panel = panelRef.current
    const flip = flipRef.current

    if (!panel || !flip || reduceMotion) {
      onClose()
      return
    }

    // Closing must not depend on the animation finishing. A throttled page may
    // never resolve `finished`, and hanging the unmount off it alone leaves a
    // modal that cannot be dismissed. Whichever comes first wins.
    let done = false
    const finish = () => {
      if (done) return
      done = true
      onClose()
    }

    // These keep `fill: both` - they do need to hold the shrunken state until
    // the component actually goes away.
    const options: KeyframeAnimationOptions = {
      duration: DURATION,
      easing: EASE_IN,
      fill: 'both',
    }

    overlayRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: DURATION * 0.8,
      easing: EASE_IN,
      fill: 'both',
    })

    // The content goes first and faster, so the frame is empty before it
    // shrinks - collapsing a full panel of text reads as a squash otherwise.
    bodyRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: DURATION * 0.35,
      easing: EASE_IN,
      fill: 'both',
    })

    innerRef.current?.animate(
      [
        { transform: 'scale(1, 1)' },
        { transform: `scale(${1 / flip.scaleX}, ${1 / flip.scaleY})` },
      ],
      options,
    )

    panel
      .animate(
        [
          { transform: 'translate(0px, 0px) scale(1, 1)' },
          {
            transform: `translate(${flip.x}px, ${flip.y}px) scale(${flip.scaleX}, ${flip.scaleY})`,
          },
        ],
        options,
      )
      .finished.then(finish, finish)

    setTimeout(finish, DURATION + 80)
  }, [onClose, reduceMotion])

  return { panelRef, innerRef, bodyRef, overlayRef, requestClose }
}
