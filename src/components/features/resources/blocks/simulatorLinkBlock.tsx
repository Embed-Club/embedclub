import type { SimulatorLinkBlock as SimulatorLinkBlockType } from '@/payload/payload-types'
import { ArrowRight, Rocket } from 'lucide-react'
import Link from 'next/link'

interface SimulatorLinkBlockProps {
  block: SimulatorLinkBlockType
}

export function SimulatorLinkBlock({ block }: SimulatorLinkBlockProps) {
  const { simulator, buttonText } = block

  if (!simulator) return null

  // Get slug from simulator relationship
  let slug = ''
  let title = ''

  if (typeof simulator === 'object' && simulator !== null) {
    // @ts-ignore - Simulators might not be in payload-types yet
    slug = simulator.slug || ''
    // @ts-ignore
    title = simulator.title || 'Simulator'
  }

  return (
    <div className="my-16 w-full animate-in fade-in zoom-in duration-500 delay-400">
      <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8 md:p-12 text-center">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-700" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-700" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_20px_hsl(var(--primary)/0.3)] group-hover:scale-110 transition-transform duration-500">
            <Rocket className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground">Ready to try it out?</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Launch the {title} and explore the concepts interactively.
            </p>
          </div>

          <Link
            href={`/simulators/${slug}`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 transition-all shadow-[0_0_30px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.6)] hover:-translate-y-1 active:translate-y-0"
          >
            {buttonText || 'Launch Simulator'}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
