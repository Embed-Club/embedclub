import { CertificateGenerator } from '@/components/features/feedback/certificate-generator'
import { MainbarShell, SidebarShell } from '@/components/layout/frontend-shell'
import config from '@/payload/payload.config'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

interface FeedbackPageProps {
  params: Promise<{
    slug: string
  }>
}

async function getFeedbackForm(slug: string) {
  try {
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'feedback-forms',
      where: {
        slug: {
          equals: slug,
        },
      },
      depth: 1,
    })

    return result.docs[0] || null
  } catch (error) {
    console.error('[Feedback] Error fetching form:', error)
    return null
  }
}

export default async function FeedbackPage({ params }: FeedbackPageProps) {
  const { slug } = await params
  const form = await getFeedbackForm(slug)

  if (!form) {
    notFound()
  }

  // Extract certificate info
  const certificateTemplate =
    form.certificateTemplate && typeof form.certificateTemplate === 'object'
      ? (form.certificateTemplate as any).url
      : null

  return (
    <SidebarShell>
      <MainbarShell>
        <div className="w-full min-h-screen bg-[#09090b] pb-24">
          <div className="container mx-auto px-6 pt-20 md:pt-28">
            <Link
              href="/resources"
              className="group inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-8"
            >
              <div className="p-1 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </div>
              Back to resources
            </Link>

            <div className="max-w-4xl mx-auto space-y-12">
              <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                  {form.title}
                </h1>
                <p className="text-zinc-400 text-lg max-w-2xl mx-auto leading-relaxed">
                  {form.description}
                </p>
              </div>

              {/* Direct link — primary action on mobile where the embedded form
                  scrolls-within-scroll; also handy on desktop */}
              <div className="flex justify-center">
                <a
                  href={form.googleFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 transition-all shadow-[0_0_24px_hsl(var(--primary)/0.3)]"
                >
                  Open form in new tab
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              {/* Google Form Iframe */}
              <div className="relative w-full aspect-[4/5] md:aspect-[4/3] rounded-2xl overflow-hidden border border-white/5 bg-white/5 shadow-2xl">
                <iframe
                  src={form.googleFormUrl}
                  className="absolute inset-0 w-full h-full border-0"
                  title={form.title}
                >
                  Loading…
                </iframe>
              </div>

              {/* Certificate Section */}
              {form.showCertificate && certificateTemplate && (
                <CertificateGenerator
                  templateUrl={certificateTemplate}
                  config={{
                    nameX: form.certificateConfig?.nameX || 400,
                    nameY: form.certificateConfig?.nameY || 300,
                    fontSize: form.certificateConfig?.fontSize || 40,
                    color: form.certificateConfig?.color || '#000000',
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </MainbarShell>
    </SidebarShell>
  )
}
