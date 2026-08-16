import { driveConfigured, resolveDriveFolderId, uploadFormFile } from '@/lib/googleDrive'
import { isRateLimited } from '@/lib/rateLimit'
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

/**
 * Leading bytes of the raster formats we accept, checked against the file
 * itself rather than the `Content-Type` the browser attached — that header is
 * whatever the client says it is. An SVG labelled `image/png` passes a MIME
 * check and is a script-execution vector once served back, so the bytes decide.
 */
const MAGIC_NUMBERS: { mime: string; bytes: number[] }[] = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] },
  // RIFF....WEBP — the four bytes at offset 8 are checked separately below.
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] },
]

/** The real image type of these bytes, or null if it is not one we accept. */
function sniffImageType(bytes: ArrayBuffer): string | null {
  const head = new Uint8Array(bytes.slice(0, 16))

  for (const { mime, bytes: sig } of MAGIC_NUMBERS) {
    if (sig.every((b, i) => head[i] === b)) {
      if (mime !== 'image/webp') return mime
      // RIFF also fronts .wav and .avi; only WEBP at offset 8 is an image.
      const webp = [0x57, 0x45, 0x42, 0x50]
      if (webp.every((b, i) => head[8 + i] === b)) return mime
    }
  }

  return null
}

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 10

function clientKey(req: NextRequest): string {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  return `upload:${ip}`
}

export async function POST(req: NextRequest) {
  try {
    if (!driveConfigured()) {
      return NextResponse.json(
        { error: 'File uploads are not configured on this site.' },
        { status: 503 },
      )
    }

    const overLimit = await isRateLimited({
      key: clientKey(req),
      windowMs: RATE_LIMIT_WINDOW_MS,
      max: RATE_LIMIT_MAX,
    })
    if (overLimit) {
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
    // Size before reading the body, so an oversized file is rejected without
    // being pulled into memory first.
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `That image is too large — the limit is ${MAX_BYTES / (1024 * 1024)}MB.` },
        { status: 413 },
      )
    }

    const bytes = await file.arrayBuffer()
    const sniffedType = sniffImageType(bytes)

    if (!sniffedType) {
      return NextResponse.json(
        { error: 'That file is not a JPEG, PNG, GIF or WebP image.' },
        { status: 400 },
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
      // The sniffed type, not the client's — Drive should store what the bytes
      // actually are.
      mimeType: sniffedType,
      bytes,
      formSlug: slug,
      fieldId,
    })

    return NextResponse.json({ id: meta.id, name: meta.name, mimeType: meta.mimeType })
  } catch (error) {
    console.error('[Forms] Upload failed:', error)
    return NextResponse.json({ error: 'Upload failed — please try again.' }, { status: 500 })
  }
}
