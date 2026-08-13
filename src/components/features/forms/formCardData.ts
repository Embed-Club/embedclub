import type { Event, Form } from '@/payload/payload-types'

/**
 * The shape the form/feedback cards render from, and the mapper that produces
 * it.
 *
 * Deliberately not inside `formCutoutCard.tsx`: that file is `'use client'`,
 * and the two listing pages are server components that call the mapper during
 * render. Next allows a server component to *render* a client component, but
 * not to *call* a function exported from a client module — doing so fails the
 * production build with "Attempted to call formToCard() from the server".
 *
 * That went unnoticed for a while because `forms.map(formToCard)` never
 * executes when the query returns no rows, so the build only broke once a form
 * actually existed.
 */
export interface FormCardData {
  id: string
  title: string
  slug: string
  description?: string | null
  deadline?: string | null
  closed: boolean
  eventTitle?: string | null
}

/** Map a Payload form doc to card data, resolving open/closed consistently. */
export function formToCard(form: Form, now: number = Date.now()): FormCardData {
  const relatedEvent = form.relatedEvent as Event | number | null | undefined
  return {
    id: String(form.id),
    title: form.title,
    slug: form.slug,
    description: form.description,
    deadline: form.deadline,
    closed: !form.active || (form.deadline ? new Date(form.deadline).getTime() < now : false),
    eventTitle:
      typeof relatedEvent === 'object' && relatedEvent !== null ? relatedEvent.title : null,
  }
}
