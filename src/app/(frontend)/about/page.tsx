import RichTextRender from '@/components/common/RichTextRender'
import { MainbarShell, SidebarShell } from '@/components/layout/FrontendShell'
import config from '@/payload/payload.config'
import type { Metadata } from 'next'
import { getPayload } from 'payload'

// ISR so CMS edits show up without a redeploy
export const revalidate = 60

export const metadata: Metadata = {
  title: 'About | Embed Club',
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

export default async function Page() {
  const about = await getAboutPage()

  return (
    <SidebarShell>
      <MainbarShell>
        <h1 className="absolute left-5 top-5 md:left-20 md:top-12 text-2xl font-medium md:text-4xl uppercase">
          {about?.title || 'About Embed Club'}
        </h1>
        <div className="max-w-3xl mx-auto px-4 md:px-8 pt-24 md:pt-40 pb-20">
          {about?.content ? (
            <RichTextRender content={about.content} />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <p className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                Nothing Here Yet
              </p>
              <p className="text-neutral-600 dark:text-neutral-400">
                This page is managed in the CMS — add content under Globals → About Page in the
                admin panel.
              </p>
            </div>
          )}
        </div>
      </MainbarShell>
    </SidebarShell>
  )
}
