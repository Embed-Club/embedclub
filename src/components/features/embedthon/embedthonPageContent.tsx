'use client'

import { AgentLoop } from '@/components/features/embedthon/agentLoop'
import { BeforeYouCome } from '@/components/features/embedthon/beforeYouCome'
import { CopperMarquee } from '@/components/features/embedthon/copperMarquee'
import { CopperMatrixGrid } from '@/components/features/embedthon/copperMatrixGrid'
import { CopperPageReveal } from '@/components/features/embedthon/copperPageReveal'
import { EmbedthonFooter } from '@/components/features/embedthon/embedthonFooter'
import { EmbedthonHero } from '@/components/features/embedthon/embedthonHero'
import { EmbedthonNav } from '@/components/features/embedthon/embedthonNav'
import { EmbedthonProgram } from '@/components/features/embedthon/embedthonProgram'
import {
  EmbedthonRevealProvider,
  useEmbedthonReveal,
} from '@/components/features/embedthon/embedthonRevealContext'
import { EventSchedule } from '@/components/features/embedthon/eventSchedule'
import type { EventType } from '@/components/features/embedthon/eventType'
import { LightSurface } from '@/components/features/embedthon/lightSurface'
import { Manifesto } from '@/components/features/embedthon/manifesto'
import { PixelCover } from '@/components/features/embedthon/pixelCover'
import { RegistrationSheet } from '@/components/features/embedthon/registrationSheet'
import { SyllabusLedger } from '@/components/features/embedthon/syllabusLedger'
import { useGentleScroll } from '@/components/features/embedthon/useGentleScroll'
import { useRestoreSiteTheme } from '@/components/features/embedthon/useRestoreSiteTheme'
import { motion } from 'motion/react'

function EmbedthonBody({ event }: { event: EventType }) {
  const { isRevealed } = useEmbedthonReveal()
  useRestoreSiteTheme()
  useGentleScroll()

  return (
    <div
      id="top"
      className="relative min-h-screen w-full bg-background font-sans transition-colors duration-150 selection:bg-primary selection:text-primary-foreground"
    >
      {/* The copper PCB board matrix the whole page sits on */}
      <CopperMatrixGrid />

      {/* Page content: loads and emerges only after the pixel animation completes */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isRevealed ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10"
      >
        {/*
         * The hero is sticky and sits behind the page; the brief rises over it with
         * its own crest as the top edge (see BriefCrest). `isolate` keeps the hero's
         * negative z-index inside this block so it can never leak behind the grid.
         */}
        <div className="relative isolate">
          <EmbedthonHero event={event} />

          <main
            className="relative flex flex-col"
            style={{ ['--crest-h' as string]: 'clamp(7rem, min(28svh, 40vw), 17rem)' }}
          >
            <Manifesto event={event} />
            {event === 'embedthon' ? (
              <EmbedthonProgram />
            ) : (
              <>
                <AgentLoop />
                <EventSchedule />
                <SyllabusLedger />
                {/*
                 * From here down the page is light. It is held at the top of the screen
                 * while a field of dark squares clears off its first screen
                 * (PixelCover), and the light comes from this wrapper, not from
                 * flipping the document.
                 */}
                <LightSurface anchor="self">
                  <PixelCover />
                  <BeforeYouCome />
                  <CopperMarquee />
                </LightSurface>
                {/* The grid stops at the ribbon. From registration to the end of the
                    page the cream is solid, with no grid lines. */}
                <LightSurface grid={false}>
                  <RegistrationSheet />
                </LightSurface>
              </>
            )}
          </main>
        </div>

        <EmbedthonFooter event={event} />
      </motion.div>

      {/* Floating navigation dock */}
      <EmbedthonNav />

      {/* The pixel animation curtain that triggers isRevealed on completion */}
      <CopperPageReveal />
    </div>
  )
}

export function EmbedthonPageContent({ event }: { event: EventType }) {
  return (
    <EmbedthonRevealProvider>
      <EmbedthonBody event={event} />
    </EmbedthonRevealProvider>
  )
}
