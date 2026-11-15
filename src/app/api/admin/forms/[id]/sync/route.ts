import { forwardPendingSubmissions } from '@/lib/googleForms'
import { syncPendingSubmissions } from '@/lib/googleSheets'
import config from '@/payload/payload.config'
import { type NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: req.headers })
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await ctx.params
    const formId = Number(id)
    if (!Number.isFinite(formId)) {
      return NextResponse.json({ error: 'Invalid form ID' }, { status: 400 })
    }

    const form = await payload.findByID({
      collection: 'forms',
      id: formId,
      depth: 0,
      overrideAccess: true,
    })

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    const force = req.nextUrl.searchParams.get('force') === 'true'

    // Find submissions to re-queue
    const submissions = await payload.find({
      collection: 'form-submissions',
      where: {
        and: [
          { form: { equals: formId } },
          ...(force ? [] : [{ googleForwardStatus: { not_equals: 'forwarded' } }]),
        ],
      },
      limit: 500,
      depth: 0,
      overrideAccess: true,
    })

    if (submissions.docs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending submissions to sync.',
        count: 0,
      })
    }

    // Reset status to pending so forwardPendingSubmissions processes them
    for (const sub of submissions.docs) {
      await payload.update({
        collection: 'form-submissions',
        id: sub.id,
        overrideAccess: true,
        data: {
          googleForwardStatus: 'pending',
          googleForwardError: null,
          ...(force ? { sheetSyncedAt: null } : {}),
        },
      })
    }

    const forwardResult = await forwardPendingSubmissions(500, formId)
    const sheetResult = await syncPendingSubmissions(500, formId)

    return NextResponse.json({
      success: true,
      count: submissions.docs.length,
      forwarded: forwardResult.forwarded,
      forwardFailed: forwardResult.failed,
      sheetSynced: sheetResult.synced,
      sheetFailed: sheetResult.failed,
    })
  } catch (error) {
    console.error('[AdminFormSync] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 },
    )
  }
}
