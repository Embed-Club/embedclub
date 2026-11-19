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
import { Manifesto } from '@/components/features/embedthon/manifesto'
import { RegistrationSheet } from '@/components/features/embedthon/registrationSheet'
import { SyllabusLedger } from '@/components/features/embedthon/syllabusLedger'
import { WavyThemeReveal } from '@/components/features/embedthon/wavyThemeReveal'
import { motion } from 'motion/react'

function EmbedthonBody({ event }: { event: EventType }) {
  const { isRevealed } = useEmbedthonReveal()

  return (
    <div
      id="top"
      className="relative min-h-screen w-full scroll-smooth bg-background font-sans transition-colors duration-150 selection:bg-primary selection:text-primary-foreground"
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
        <EmbedthonHero event={event} />

        {/*
         * The wave lives inside the content layer so the brief can paint above
         * it: the sheet sweeps over the hero, while the brief it hands off to
         * already shows through and its words are mid-flight as the light
         * arrives, instead of appearing only after the sheet drops away.
         */}
        <WavyThemeReveal />

        <main className="relative flex flex-col">
          <Manifesto event={event} />
          {event === 'embedthon' ? (
            <EmbedthonProgram />
          ) : (
            <>
              <AgentLoop />
              <EventSchedule />
              <SyllabusLedger />
              <BeforeYouCome />
              <CopperMarquee />
              <RegistrationSheet />
            </>
          )}
        </main>

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
