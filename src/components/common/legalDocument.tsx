import { PageTitle } from '@/components/common/pageTitle'
import RichTextRender from '@/components/common/richTextRender'
import { MainbarShell, SidebarShell } from '@/components/layout/frontendShell'
import type { LegalPage } from '@/payload/payload-types'
import type { ReactNode } from 'react'

/**
 * Privacy and terms carry their own sections field, but the two are the same
 * shape, so the renderer takes either.
 */
type LegalSection = NonNullable<LegalPage['privacySections']>[number]

interface LegalDocumentProps {
  title: string
  /** Lexical content from the Legal Pages global, shown above the sections. */
  content?: Record<string, unknown> | null
  /** Ordered sections shown below the intro. */
  sections?: LegalSection[] | null
  /** ISO date the policy was last revised. */
  lastUpdated?: string | null
  /**
   * Rendered below the content and sections - e.g. the email/phone row on
   * /contact. Doesn't count toward `hasAnything`: a page with only this and no
   * written content still shows as unwritten.
   */
  extra?: ReactNode
  /** Shown when the CMS has no wording for this page yet. */
  empty: ReactNode
}

function LegalSectionBlock({ section }: { section: LegalSection }) {
  switch (section.blockType) {
    case 'legalHeadingBlock':
      // Same banner panel as the About page's heading block, so a section break
      // reads identically on both. No background image or subheading here -
      // those are About's fields, and a policy page has no use for either.
      return (
        <div className="relative my-12 overflow-hidden rounded-2xl border border-border">
          <div className="relative px-6 py-10 md:px-12 md:py-14 text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold uppercase tracking-normal [-webkit-text-stroke:1.2px]">
              {section.heading}
            </h2>
          </div>
        </div>
      )
    case 'legalTextBlock':
      return (
        <div className="my-6">
          <RichTextRender content={section.text} />
        </div>
      )
    default:
      return null
  }
}

/**
 * The shared frame for /privacy and /terms - the same page twice, differing
 * only in which fields of the Legal Pages global it renders.
 *
 * Same column and the same intro-then-sections shape as the About page, so
 * prose lines up at one width across every text page and members edit both
 * pages the same way.
 */
export function LegalDocument({
  title,
  content,
  sections,
  lastUpdated,
  extra,
  empty,
}: LegalDocumentProps) {
  const blocks = sections ?? []
  // The date alone isn't content - a page with only "last updated" on it should
  // still read as unwritten.
  const hasAnything = Boolean(content) || blocks.length > 0

  const revised = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <SidebarShell>
      <MainbarShell>
        <PageTitle>{title}</PageTitle>
        <div className="max-w-5xl mx-auto px-4 md:px-8 pt-24 md:pt-40 pb-20">
          {!hasAnything ? (
            empty
          ) : (
            <>
              {revised && (
                <p className="mb-8 text-sm text-muted-foreground">Last updated {revised}</p>
              )}
              {content && <RichTextRender content={content} />}
              {blocks.map((section, i) => (
                <LegalSectionBlock key={section.id ?? i} section={section} />
              ))}
            </>
          )}
          {/* Outside the empty check: the email/phone row on /contact should
              still show even on a day the intro prose hasn't been written. */}
          {extra}
        </div>
      </MainbarShell>
    </SidebarShell>
  )
}
