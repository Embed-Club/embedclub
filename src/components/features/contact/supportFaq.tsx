import RichTextRender from '@/components/common/richTextRender'
import type { SupportPage } from '@/payload/payload-types'
import { ChevronDown } from 'lucide-react'

type FaqItem = NonNullable<SupportPage['supportFaq']>[number]

/**
 * The support answers, folded into /contact as an accordion - /support was a
 * second thin page for the same job, so the two merged.
 *
 * Native `<details>` / `<summary>`, same as the resources accordion block: it
 * gets keyboard support, the right ARIA semantics, and find-on-page opening a
 * closed section for free, and stays a server component.
 */
export function SupportFaq({ items }: { items?: FaqItem[] | null }) {
  const faq = items ?? []
  if (faq.length === 0) return null

  return (
    <section className="mt-14">
      <h2 className="mb-5 text-2xl font-bold uppercase tracking-tight text-foreground">Support</h2>
      <div className="flex flex-col gap-3">
        {faq.map((item, index) => (
          <details
            key={item.id ?? index}
            className="group overflow-hidden rounded-2xl border border-border bg-card/60 transition-colors open:border-primary/40"
          >
            <summary className="flex cursor-pointer list-none items-start gap-3 p-4 sm:gap-4 sm:p-5 [&::-webkit-details-marker]:hidden">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/40 text-primary transition-transform duration-300 group-open:rotate-180">
                <ChevronDown className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1 font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                {item.question}
              </span>
            </summary>

            <div className="border-t border-border px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
              <RichTextRender content={item.answer} />
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}
