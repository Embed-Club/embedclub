import { EmptyState } from '@/components/common/emptyState'
import RichTextRender from '@/components/common/richTextRender'
import { MainbarShell, SidebarShell } from '@/components/layout/frontendShell'
import { cn } from '@/lib/utils'
import type { AboutPage, Media } from '@/payload/payload-types'
import config from '@/payload/payload.config'
import type { Metadata } from 'next'
import Image from 'next/image'
import { getPayload } from 'payload'

// ISR so CMS edits show up without a redeploy
export const revalidate = 60

export const metadata: Metadata = {
  title: 'About',
  description: 'About Embed Club — inspiring innovation at PACE since 2018.',
}

async function getAboutPage() {
  try {
    const payload = await getPayload({ config })
    return await payload.findGlobal({ slug: 'about-page' })
  } catch (error) {
    console.error('[About] Error fetching global:', error)
    return null
  }
}

type Section = NonNullable<AboutPage['sections']>[number]

function mediaUrl(image: number | Media | null | undefined): string | null {
  if (typeof image !== 'object' || image === null) return null
  return image.url ?? null
}

function AboutSection({ section }: { section: Section }) {
  switch (section.blockType) {
    case 'bannerBlock': {
      const bg = mediaUrl(section.backgroundImage)
      return (
        <div className="relative my-12 overflow-hidden rounded-2xl border border-border">
          {bg && (
            <>
              <Image src={bg} alt="" fill className="object-cover" sizes="64rem" />
              <div className="absolute inset-0 bg-background/70" />
            </>
          )}
          <div className="relative px-6 py-10 md:px-12 md:py-14 text-center">
            <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight">
              {section.heading}
            </h2>
            {section.subheading && (
              <p className="mt-3 text-muted-foreground md:text-lg">{section.subheading}</p>
            )}
          </div>
        </div>
      )
    }
    case 'aboutTextBlock':
      return (
        <div className="my-6">
          <RichTextRender content={section.text} />
        </div>
      )
    case 'aboutImageBlock': {
      const src = mediaUrl(section.image)
      if (!src) return null
      const media = section.image as Media
      const sizeClass =
        section.size === 'small' ? 'max-w-sm' : section.size === 'medium' ? 'max-w-lg' : 'w-full'
      const positionClass =
        section.position === 'left'
          ? 'md:float-left md:mr-8'
          : section.position === 'right'
            ? 'md:float-right md:ml-8'
            : 'mx-auto clear-both'

      return (
        <figure className={cn('my-8 space-y-2', sizeClass, positionClass)}>
          <div className="relative overflow-hidden rounded-2xl border border-border">
            <Image
              src={src}
              alt={media.alt || section.caption || ''}
              width={media.width ?? 1200}
              height={media.height ?? 800}
              className="h-auto w-full object-cover"
              sizes="(max-width: 768px) 100vw, 40rem"
            />
          </div>
          {section.caption && (
            <figcaption className="text-center text-sm italic text-muted-foreground">
              {section.caption}
            </figcaption>
          )}
        </figure>
      )
    }
    default:
      return null
  }
}

export default async function Page() {
  const about = await getAboutPage()
  const sections = about?.sections ?? []
  const hasAnything = Boolean(about?.content) || sections.length > 0

  return (
    <SidebarShell>
      <MainbarShell>
        <h1 className="absolute left-5 top-5 md:left-20 md:top-12 text-2xl font-medium md:text-4xl uppercase">
          {about?.title || 'About Embed Club'}
        </h1>
        <div className="max-w-5xl mx-auto px-4 md:px-8 pt-24 md:pt-40 pb-20">
          {!hasAnything ? (
            <EmptyState />
          ) : (
            <div className="clear-both">
              {about?.content && <RichTextRender content={about.content} />}
              {sections.map((section, i) => (
                <AboutSection key={section.id ?? i} section={section} />
              ))}
            </div>
          )}
        </div>
      </MainbarShell>
    </SidebarShell>
  )
}
