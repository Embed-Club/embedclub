import { EmptyState } from '@/components/common/empty-state'
import RichTextRender from '@/components/common/rich-text-render'
import { MainbarShell, SidebarShell } from '@/components/layout/frontend-shell'
import config from '@/payload/payload.config'
import { ChevronRight, Clock, Lock } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'

// ISR so CMS edits show up without a redeploy
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Feedback | Embed Club',
  description: 'Submit feedback for Embed Club workshops and events.',
}

async function getFeedbackData() {
  try {
    const payload = await getPayload({ config })
    const [page, forms] = await Promise.all([
      payload.findGlobal({ slug: 'feedback-page' }),
      payload.find({
        collection: 'feedback-forms',
        sort: '-createdAt',
        limit: 50,
      }),
    ])
    return { page, forms: forms.docs }
  } catch (error) {
    console.error('[Feedback] Error fetching data:', error)
    return { page: null, forms: [] }
  }
}

export default async function Page() {
  const { page, forms } = await getFeedbackData()
  const now = Date.now()

  return (
    <SidebarShell>
      <MainbarShell>
        <h1 className="absolute left-5 top-5 md:left-20 md:top-12 text-2xl font-medium md:text-4xl uppercase">
          {page?.title || 'Feedback'}
        </h1>
        <div className="max-w-3xl mx-auto px-4 md:px-8 pt-24 md:pt-40 pb-20 space-y-10">
          {page?.intro && <RichTextRender content={page.intro} />}

          {forms.length === 0 ? (
            <EmptyState title="No Feedback Forms Yet" />
          ) : (
            <ul className="space-y-4">
              {forms.map((form) => {
                const closed = form.deadline ? new Date(form.deadline).getTime() < now : false
                const deadlineLabel = form.deadline
                  ? new Date(form.deadline).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })
                  : null

                return (
                  <li key={form.id}>
                    {closed ? (
                      <div className="flex items-center justify-between gap-4 p-5 rounded-xl border border-border bg-muted/40 opacity-70">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{form.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {form.description}
                          </p>
                        </div>
                        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground shrink-0">
                          <Lock className="h-3.5 w-3.5" />
                          Closed
                        </span>
                      </div>
                    ) : (
                      <Link
                        href={`/feedback/${form.slug}`}
                        className="group flex items-center justify-between gap-4 p-5 rounded-xl border border-border bg-card hover:border-primary/60 hover:shadow-[0_0_24px_hsl(var(--primary)/0.15)] transition-all"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold truncate group-hover:text-primary transition-colors">
                            {form.title}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {form.description}
                          </p>
                          {deadlineLabel && (
                            <p className="flex items-center gap-1.5 text-xs text-primary mt-2">
                              <Clock className="h-3.5 w-3.5" />
                              Open until {deadlineLabel}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </MainbarShell>
    </SidebarShell>
  )
}
