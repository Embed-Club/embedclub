import { cn } from '@/lib/utils'
import type { FormMedia } from '@/payload/payload-types'
import type { ReactNode } from 'react'
import { FormImage } from './formImage'
import { LinkifiedText } from './linkifiedText'

interface FormHeaderProps {
  title: string
  description?: string | null
  headerImage?: number | FormMedia | null
  /** Shown above the title - the parent form's name on a section, as a link back. */
  above?: ReactNode
  /** The "* Indicates required question" line - only on a form that has one. */
  showRequiredNote?: boolean
  className?: string
}

/**
 * The card a form opens with, the way Google Forms does it: the banner, the
 * title, the description, and the note about the asterisk. Shared by the open
 * form, a closed one, and a sectioned form's choice of sections, so they all
 * start the same way.
 */
export function FormHeader({
  title,
  description,
  headerImage,
  above,
  showRequiredNote,
  className,
}: FormHeaderProps) {
  return (
    <header
      className={cn(
        'overflow-hidden rounded-2xl border border-border border-t-4 border-t-primary bg-card',
        className,
      )}
    >
      <FormImage media={headerImage} slot="header" priority className="px-4 pt-4 md:px-6 md:pt-6" />
      <div className="space-y-3 p-6 md:p-8">
        {above}
        <h1 className="text-balance text-[28px] font-extrabold leading-tight tracking-tight md:text-[36px]">
          {title}
        </h1>
        <LinkifiedText
          text={description}
          className="text-[15px] leading-relaxed text-foreground/85"
        />
        {showRequiredNote && (
          <p className="border-t border-border pt-3 text-sm text-muted-foreground">
            <span className="text-primary">*</span> Indicates required question
          </p>
        )}
      </div>
    </header>
  )
}
