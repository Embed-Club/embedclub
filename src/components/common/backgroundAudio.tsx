'use client'

import {
  FlipButton,
  FlipButtonBack,
  FlipButtonFront,
} from '@/components/animate-ui/components/buttons/flip'
import { IntroContext } from '@/components/layout/frontendShell'
import { Volume2, VolumeX } from 'lucide-react'
import { useContext, useEffect, useSyncExternalStore } from 'react'

// Module-level singleton so the headless player (home page) and the toggle
// button (shell header) share one audio element and one playing state.
type AudioSnapshot = { available: boolean; playing: boolean }

let audio: HTMLAudioElement | null = null
// True when playback was paused because the page went to the background, so we
// know to resume on return — and to never resume a track the user paused by hand.
let pausedByVisibility = false
// True once the user has pressed pause. Persisted, so the choice survives a
// reload and a fresh mount — otherwise every refresh re-armed autoplay and the
// next tap anywhere on the page started the music again.
let userMuted = false

const MUTED_STORAGE_KEY = 'embedClub.backgroundAudioMuted'

function readMutedPreference() {
  try {
    return localStorage.getItem(MUTED_STORAGE_KEY) === '1'
  } catch {
    // Private mode / storage disabled — fall back to the default (unmuted).
    return false
  }
}

function setMutedPreference(muted: boolean) {
  userMuted = muted
  try {
    localStorage.setItem(MUTED_STORAGE_KEY, muted ? '1' : '0')
  } catch {
    // Preference is still honoured for this page view via `userMuted`.
  }
}
let snapshot: AudioSnapshot = { available: false, playing: false }
const listeners = new Set<() => void>()

function setSnapshot(next: AudioSnapshot) {
  snapshot = next
  for (const l of listeners) l()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return snapshot
}

// Must be a stable reference — React compares snapshots by identity and
// treats a fresh object every call as an endlessly changing store.
const SERVER_SNAPSHOT: AudioSnapshot = { available: false, playing: false }

function getServerSnapshot(): AudioSnapshot {
  return SERVER_SNAPSHOT
}

async function play() {
  if (!audio) return
  // Single chokepoint for the mute preference — every start path routes through
  // here, so no stray listener or resume can override a deliberate pause.
  if (userMuted) return
  try {
    await audio.play()
    setSnapshot({ available: true, playing: true })
  } catch {
    // Autoplay blocked — stays paused until a user gesture (or the toggle button)
    setSnapshot({ available: true, playing: false })
  }
}

function pause() {
  if (!audio) return
  audio.pause()
  setSnapshot({ available: true, playing: false })
}

export function toggleBackgroundAudio() {
  if (!audio) return
  if (audio.paused) {
    setMutedPreference(false)
    void play()
  } else {
    setMutedPreference(true)
    pause()
  }
}

/**
 * Headless player. Mount on pages that should have background music.
 * Starts once the intro logo animation is done and the page view has faded in.
 */
export function BackgroundAudio() {
  const { isIntroFinished } = useContext(IntroContext)

  useEffect(() => {
    if (!isIntroFinished) return

    if (!audio) {
      audio = new Audio('/Home.m4a')
      audio.loop = true
      audio.volume = 0.075 // Subtle, non-intrusive background volume
    }
    userMuted = readMutedPreference()
    setSnapshot({ available: true, playing: !audio.paused })

    // MainbarShell fades the page content in 600ms after the intro finishes —
    // start the music together with that reveal, not with the logo animation.
    const startTimer = setTimeout(() => {
      // Muted by choice on a previous visit — stay silent until they press play.
      if (userMuted) return
      // Don't start music into a backgrounded tab — resume when they return.
      if (document.visibilityState === 'visible') {
        void play()
      } else {
        pausedByVisibility = true
      }
    }, 600)

    // If the browser blocked autoplay, the first user gesture starts playback.
    // Not `once` — keeps retrying until play() actually succeeds.
    const handleInteraction = (event: Event) => {
      // Taps on an audio control are that control's business — let its own
      // handler decide. Needed because `touchstart` on window fires *before*
      // React's click, so without this a tap on the toggle would start playback
      // here and then be immediately paused by the toggle itself.
      const target = event.target
      if (target instanceof Element && target.closest('[data-audio-control]')) return
      // The pause click itself bubbles up to window, so without this the toggle
      // would restart the track it just stopped — as would any later tap.
      if (userMuted) {
        removeListeners()
        return
      }
      if (audio?.paused && !snapshot.playing) {
        void play().then(() => {
          if (audio && !audio.paused) removeListeners()
        })
      } else {
        removeListeners()
      }
    }
    const removeListeners = () => {
      window.removeEventListener('click', handleInteraction)
      window.removeEventListener('touchstart', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
    }
    if (!userMuted) {
      window.addEventListener('click', handleInteraction)
      window.addEventListener('touchstart', handleInteraction)
      window.addEventListener('keydown', handleInteraction)
    }

    // Pause whenever the page isn't the user's active view, and resume on
    // return. The two signals cover different cases:
    //   • visibilitychange / pagehide — tab hidden, window minimized, phone
    //     locked, or the mobile browser sent to the background (the reliable
    //     mobile signal; iOS also fires pagehide/pageshow via the bfcache).
    //   • window blur / focus — desktop switching to another app while the tab
    //     stays visible.
    // Window focus is tracked with a flag rather than document.hasFocus(), which
    // is unreliable on mobile; browsers that never fire blur/focus stay purely
    // visibility-driven, which is exactly right for mobile. The resume is gated
    // on snapshot.playing (our intent) — not audio.paused, since the mobile OS
    // may have already paused the element — so a manual pause is never resumed.
    let windowActive = true
    const syncPlayback = () => {
      const active = document.visibilityState === 'visible' && windowActive
      if (!active) {
        if (snapshot.playing) {
          audio?.pause()
          pausedByVisibility = true
          setSnapshot({ available: true, playing: false })
        }
      } else if (pausedByVisibility && !userMuted) {
        pausedByVisibility = false
        void play()
      }
    }
    const handleBlur = () => {
      windowActive = false
      syncPlayback()
    }
    const handleFocus = () => {
      windowActive = true
      syncPlayback()
    }
    document.addEventListener('visibilitychange', syncPlayback)
    document.addEventListener('pagehide', handleBlur)
    document.addEventListener('pageshow', handleFocus)
    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)

    return () => {
      clearTimeout(startTimer)
      removeListeners()
      document.removeEventListener('visibilitychange', syncPlayback)
      document.removeEventListener('pagehide', handleBlur)
      document.removeEventListener('pageshow', handleFocus)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
      pausedByVisibility = false
      if (audio) {
        audio.pause()
        audio = null
      }
      setSnapshot({ available: false, playing: false })
    }
  }, [isIntroFinished])

  return null
}

/**
 * Compact round play/pause button for small screens (desktop uses AudioToggle
 * next to the theme toggle). Renders nothing on pages without background audio.
 */
export function AudioToggleMini() {
  const { available, playing } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  if (!available) return null

  return (
    <button
      type="button"
      data-audio-control
      onClick={toggleBackgroundAudio}
      aria-label={playing ? 'Pause background music' : 'Play background music'}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/60 text-foreground backdrop-blur-sm transition-colors hover:text-primary hover:border-primary/60"
    >
      {playing ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
    </button>
  )
}

/**
 * Tiny mute/unmute button. Renders nothing on pages without background audio.
 * Styled to sit next to ModeToggle.
 */
export function AudioToggle() {
  const { available, playing } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  if (!available) return null

  return (
    <FlipButton
      onClick={toggleBackgroundAudio}
      aria-label={playing ? 'Pause background music' : 'Play background music'}
      from="bottom"
    >
      <FlipButtonFront>
        {playing ? (
          <Volume2 className="h-[1.2rem] w-[1.2rem]" />
        ) : (
          <VolumeX className="h-[1.2rem] w-[1.2rem]" />
        )}
      </FlipButtonFront>
      <FlipButtonBack>
        {playing ? (
          <VolumeX className="h-[1.2rem] w-[1.2rem]" />
        ) : (
          <Volume2 className="h-[1.2rem] w-[1.2rem]" />
        )}
      </FlipButtonBack>
    </FlipButton>
  )
}
