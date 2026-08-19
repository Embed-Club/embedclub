/**
 * Bulk-fix imported forms: mark every form active, and closed.
 *
 *   pnpm tsx scripts/setAllFormsActiveClosed.ts
 *
 * `closed` isn't a field - formToCard derives it as
 * `!active || deadline < now` (src/components/features/forms/formCardData.ts).
 * So "active but closed" means: active = true, and a deadline in the past.
 * A form that already has a past deadline is left alone; one with no
 * deadline, or a future one, gets a deadline of one hour ago.
 */
import 'dotenv/config'
import config from '@payload-config'
import { getPayload } from 'payload'
import { flushExit } from './lib/learningSeed'

async function run() {
  const payload = await getPayload({ config })
  const now = Date.now()
  const pastDeadline = new Date(now - 60 * 60 * 1000).toISOString()

  const { docs: forms } = await payload.find({
    collection: 'forms',
    limit: 1000,
    depth: 0,
  })

  let updated = 0
  for (const form of forms) {
    const deadlineIsPast = form.deadline ? new Date(form.deadline).getTime() < now : false
    const needsActive = !form.active
    const needsDeadline = !deadlineIsPast

    if (!needsActive && !needsDeadline) continue

    await payload.update({
      collection: 'forms',
      id: form.id,
      data: {
        active: true,
        ...(needsDeadline ? { deadline: pastDeadline } : {}),
      },
    })
    updated++
    console.log(`Updated: ${form.title}`)
  }

  console.log(`\nDone. ${updated}/${forms.length} forms updated - all active and closed.`)
  flushExit(0)
}

run().catch((err) => {
  console.error(err)
  flushExit(1)
})
