import { MainbarShell, SidebarShell } from '@/components/FrontendShell'
import Link from 'next/link'

interface ResourceDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function ResourceDetailPage({ params }: ResourceDetailPageProps) {
  const { slug } = await params

  return (
    <SidebarShell>
      <MainbarShell>
        <div className="w-full px-4 pt-20 md:pt-28 pb-16">
          <Link
            href="/resources"
            className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white transition-colors"
          >
            <span aria-hidden="true">←</span>
            Back to resources
          </Link>

          <div className="mt-10 max-w-2xl">
            <h1 className="text-3xl font-semibold text-white md:text-4xl">
              Resource details coming soon
            </h1>
            <p className="mt-3 text-base text-zinc-300 md:text-lg">
              This page is a placeholder while we set up the full resource content. We will load
              details from Payload CMS later.
            </p>
            <p className="mt-6 text-sm text-zinc-500">Slug: {slug}</p>
          </div>
        </div>
      </MainbarShell>
    </SidebarShell>
  )
}
