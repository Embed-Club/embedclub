import { driveConfigured, resolveDriveFolderId, uploadFormFile } from '@/lib/googleDrive'
import config from '@/payload/payload.config'
import { type NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

// Streams a real file to Google Drive on every call — never prerender or cache.
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Where a respondent's photo goes when they attach it to a form.
 *
 * Open to the public by necessity — the person filling the form is not logged
 * in — so everything that limits the blast radius is here: the form has to
 * exist, be open, and actually contain an `imageUpload` question with this id;
 * the file has to be an image under the size cap; and one IP gets a handful of
 * uploads a minute.
 *
 * The response is a Drive file id. It is stamped with the form slug and field
 * id in `appProperties`, which is what the submit action re-checks before
 * trusting the id it is handed (see `forms/actions.ts`).
 */
const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED_PREFIX = 'image/'

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 10
const recentUploads = new Map<string, number[]>()

function rateLimited(key: string): boolean {
  const now = Date.now()
  const hits = (recentUploads.get(key) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  hits.push(now)
  recentUploads.set(key, hits)

  if (recentUploads.size > 500) {
    for (const [k, v] of recentUploads) {
      if (v.every((t) => now - t > RATE_LIMIT_WINDOW_MS)) recentUploads.delete(k)
    }
  }

  return hits.length > RATE_LIMIT_MAX
}

function clientKey(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

export async function POST(req: NextRequest) {
  try {
    if (!driveConfigured()) {
      return NextResponse.json(
        { error: 'File uploads are not configured on this site.' },
        { status: 503 },
      )
    }

    if (rateLimited(clientKey(req))) {
      return NextResponse.json({ error: 'Too many uploads — wait a minute.' }, { status: 429 })
    }

    const form = await req.formData()
    const slug = String(form.get('formSlug') ?? '')
    const fieldId = String(form.get('fieldId') ?? '')
    const file = form.get('file')

    if (!slug || !fieldId || !(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file, form or question.' }, { status: 400 })
    }

    if (!file.type.startsWith(ALLOWED_PREFIX)) {
      return NextResponse.json({ error: 'Only image files can be attached.' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `That image is too large — the limit is ${MAX_BYTES / (1024 * 1024)}MB.` },
        { status: 413 },
      )
    }

    const payload = await getPayload({ config })
    const found = await payload.find({
      collection: 'forms',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    })
    const formDoc = found.docs[0]

    if (!formDoc)
      return NextResponse.json({ error: 'This form no longer exists.' }, { status: 404 })
    if (!formDoc.active) {
      return NextResponse.json({ error: 'This form is closed.' }, { status: 403 })
    }
    if (formDoc.deadline && new Date(formDoc.deadline).getTime() < Date.now()) {
      return NextResponse.json({ error: 'The deadline for this form has passed.' }, { status: 403 })
    }

    // The question must exist on the form *and* be an upload question. Without
    // this the route would happily write a file for any form at all.
    const question = (formDoc.steps ?? [])
      .flatMap((step) => step.fields ?? [])
      .find((field) => field.id === fieldId)

    if (!question || question.fieldType !== 'imageUpload') {
      return NextResponse.json({ error: 'That question does not take a file.' }, { status: 400 })
    }

    const folderId = resolveDriveFolderId(formDoc.driveFolderId)
    if (!folderId) {
      return NextResponse.json(
        { error: 'This form has no Drive folder set up for uploads.' },
        { status: 503 },
      )
    }

    const meta = await uploadFormFile({
      folderId,
      // Prefix so a folder of 300 files is still navigable by eye.
      fileName: `${slug}-${Date.now()}-${file.name}`,
      mimeType: file.type,
      bytes: await file.arrayBuffer(),
      formSlug: slug,
      fieldId,
    })

    return NextResponse.json({ id: meta.id, name: meta.name, mimeType: meta.mimeType })
  } catch (error) {
    console.error('[Forms] Upload failed:', error)
    return NextResponse.json({ error: 'Upload failed — please try again.' }, { status: 500 })
  }
}
