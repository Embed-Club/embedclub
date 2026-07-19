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
    void play()
  } else {
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
      audio.volume = 0.15 // Subtle, non-intrusive background volume
    }
    setSnapshot({ available: true, playing: !audio.paused })

    // MainbarShell fades the page content in 600ms after the intro finishes —
    // start the music together with that reveal, not with the logo animation.
    const startTimer = setTimeout(() => {
      // Don't start music into a hidden/blurred tab — resume when they return.
      if (document.visibilityState === 'visible' && document.hasFocus()) {
        void play()
      } else {
        pausedByVisibility = true
      }
    }, 600)

    // If the browser blocked autoplay, the first user gesture starts playback.
    // Not `once` — keeps retrying until play() actually succeeds.
    const handleInteraction = () => {
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
    window.addEventListener('click', handleInteraction)
    window.addEventListener('touchstart', handleInteraction)
    window.addEventListener('keydown', handleInteraction)

    // Pause whenever the page isn't the user's active view — tab hidden, window
    // minimized, or focus moved to another app — and resume on return. Guarded
    // by pausedByVisibility so a manual pause is never overridden.
    const syncPlaybackToVisibility = () => {
      const active = document.visibilityState === 'visible' && document.hasFocus()
      if (!active) {
        if (audio && !audio.paused) {
          audio.pause()
          pausedByVisibility = true
          setSnapshot({ available: true, playing: false })
        }
      } else if (pausedByVisibility) {
        pausedByVisibility = false
        void play()
      }
    }
    document.addEventListener('visibilitychange', syncPlaybackToVisibility)
    window.addEventListener('blur', syncPlaybackToVisibility)
    window.addEventListener('focus', syncPlaybackToVisibility)

    return () => {
      clearTimeout(startTimer)
      removeListeners()
      document.removeEventListener('visibilitychange', syncPlaybackToVisibility)
      window.removeEventListener('blur', syncPlaybackToVisibility)
      window.removeEventListener('focus', syncPlaybackToVisibility)
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
