import { previewCertificate, sendCertificate } from '@/lib/appsScript'
import { fillPlaceholders } from '@/lib/certificateDispatch'
import { applyNameCase } from '@/lib/textCase'
import config from '@/payload/payload.config'
import { type NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

type TestRequest = {
  certificateId?: number
  mode?: 'preview' | 'email'
  name?: string
  email?: string
  placeholders?: Record<string, string>
}

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: TestRequest
  try {
    body = (await req.json()) as TestRequest
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!body.certificateId || !body.name?.trim()) {
    return NextResponse.json(
      { error: 'Save the certificate first, and enter a test name.' },
      { status: 400 },
    )
  }

  const certificate = await payload.findByID({
    collection: 'certificates',
    id: body.certificateId,
    depth: 1,
    overrideAccess: true,
  })

  const templateId = certificate.templateDriveId?.trim()
  if (!templateId) {
    return NextResponse.json(
      { error: 'Add a Google Slides certificate template first.' },
      { status: 400 },
    )
  }

  const mode = body.mode === 'email' ? 'email' : 'preview'
  if (mode === 'email' && !body.email?.trim()) {
    return NextResponse.json(
      { error: 'An email address is required for email testing.' },
      { status: 400 },
    )
  }

  const form = typeof certificate.form === 'object' ? certificate.form : null
  const eventName = certificate.eventName?.trim() || form?.title || certificate.title || ''
  const certificateName = applyNameCase(body.name.trim(), certificate.nameCase)
  const emailName = applyNameCase(body.name.trim(), certificate.emailNameCase)
  const placeholders = {
    name: certificateName,
    event: eventName,
    ...(body.placeholders ?? {}),
  }
  const request = {
    certificateName,
    emailName,
    formTitle: eventName,
    templateId,
    placeholders,
    emailSubject: certificate.emailSubject
      ? fillPlaceholders(certificate.emailSubject, emailName, eventName)
      : undefined,
    emailBody: certificate.emailBody
      ? fillPlaceholders(certificate.emailBody, emailName, eventName)
      : undefined,
  }

  try {
    if (mode === 'preview') {
      const preview = await previewCertificate(request)
      return NextResponse.json(preview)
    }

    await sendCertificate({ ...request, email: body.email?.trim() ?? '' })
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Certificates] Test failed:', message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
