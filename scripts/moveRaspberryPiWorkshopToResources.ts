/**
 * Move the "Raspberry Pi Workshop: Four Sessions" document from `tutorials`
 * to `resources`.
 *
 * It assumes a Pi already set up (SSH working) rather than teaching setup
 * itself — that belongs in Resources, next to the club's other follow-on
 * material, not in Tutorials next to the setup guide it depends on. Mirrors
 * `moveResourcesToTutorials.ts` in the opposite direction: read the source at
 * depth 0 (relationships come back as bare ids, which is what create()
 * wants), recreate it under `resources` with the same slug, then delete the
 * original. Idempotent — a doc already moved is skipped, and re-running does
 * not duplicate.
 *
 *   pnpm tsx scripts/moveRaspberryPiWorkshopToResources.ts
 *
 * Targets the same Neon instance production uses, so the change is live
 * immediately.
 */
import 'dotenv/config'
import type { Resource } from '@/payload/payload-types'
import config from '@payload-config'
import { getPayload } from 'payload'

/** Fields Payload assigns; everything else on a doc is editor-authored. */
type ManagedFields = 'id' | '_order' | 'createdAt' | 'updatedAt'

const SLUG = 'raspberry-pi-workshop-four-sessions'

async function main() {
  const payload = await getPayload({ config })

  const inTutorials = await payload.find({
    collection: 'tutorials',
    where: { slug: { equals: SLUG } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  const alreadyMoved = await payload.find({
    collection: 'resources',
    where: { slug: { equals: SLUG } },
    limit: 1,
    overrideAccess: true,
  })

  if (alreadyMoved.docs.length > 0) {
    // Already a resource. If a tutorial copy still lingers (an interrupted
    // earlier run), remove it so the two collections don't both claim it.
    if (inTutorials.docs.length > 0) {
      await payload.delete({
        collection: 'tutorials',
        id: inTutorials.docs[0].id,
        overrideAccess: true,
      })
      console.log(`Removed leftover tutorial copy of "${SLUG}".`)
    } else {
      console.log(`"${SLUG}" is already a resource. Skipping.`)
    }
    return
  }

  if (inTutorials.docs.length === 0) {
    console.log(`"${SLUG}" not found in tutorials. Skipping.`)
    return
  }

  const source = inTutorials.docs[0]
  const sourceId = source.id

  // Strip the fields Payload owns; carry everything the editor authored.
  // `_order` is dropped too: it is the orderable rank, unique within a
  // collection, so the destination assigns a fresh appended rank rather than
  // inheriting the source's.
  const { id, _order, createdAt, updatedAt, ...rest } = source as unknown as Record<string, unknown>

  const created = await payload.create({
    collection: 'resources',
    // Resources and Tutorials share a field shape (learningFields.ts), so a
    // tutorial's authored fields are exactly a resource's create payload.
    data: rest as Omit<Resource, ManagedFields>,
    overrideAccess: true,
  })
  console.log(`Created resource ${created.id} ("${SLUG}").`)

  await payload.delete({ collection: 'tutorials', id: sourceId, overrideAccess: true })
  console.log(`Deleted tutorial ${sourceId} ("${SLUG}").`)
}

main()
  .then(() => process.stdout.write('', () => process.exit(0)))
  .catch((err) => {
    console.error(err)
    process.stdout.write('', () => process.exit(1))
  })
