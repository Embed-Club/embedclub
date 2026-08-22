import { previewCertificate, sendCertificate } from '@/lib/appsScript'
import { applyNameCase } from '@/lib/textCase'
import config from '@/payload/payload.config'
import { type NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

type TestRequest = {
  formId?: number
  mode?: 'preview' | 'email'
  name?: string
  email?: string
  placeholders?: Record<string, string>
}

function fillPlaceholders(template: string, name: string, event: string): string {
  return template.replaceAll('{{name}}', name).replaceAll('{{event}}', event)
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

  if (!body.formId || !body.name?.trim()) {
    return NextResponse.json({ error: 'A form and test name are required.' }, { status: 400 })
  }

  const form = await payload.findByID({ collection: 'forms', id: body.formId, depth: 0 })
  if (!form.showCertificate) {
    return NextResponse.json(
      { error: 'Enable certificate delivery on this form before testing it.' },
      { status: 400 },
    )
  }

  const templateId = form.certificateTemplateDriveId?.trim()
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
  if (
    mode === 'email' &&
    (!form.certificateEmailSubject?.trim() || !form.certificateEmailBody?.trim())
  ) {
    return NextResponse.json(
      { error: 'Add an email subject and body before sending a test certificate.' },
      { status: 400 },
    )
  }

  const certificateName = applyNameCase(body.name.trim(), form.certificateNameCase)
  const emailName = applyNameCase(body.name.trim(), form.certificateEmailNameCase)
  const placeholders = {
    name: certificateName,
    event: form.title,
    ...(body.placeholders ?? {}),
  }
  const request = {
    certificateName,
    emailName,
    formTitle: form.title,
    templateId,
    placeholders,
    emailSubject: form.certificateEmailSubject
      ? fillPlaceholders(form.certificateEmailSubject, emailName, form.title)
      : undefined,
    emailBody: form.certificateEmailBody
      ? fillPlaceholders(form.certificateEmailBody, emailName, form.title)
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
