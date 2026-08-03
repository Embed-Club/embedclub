/**
 * Move specific documents from the `resources` collection to `tutorials`.
 *
 * Resources and Tutorials are the same document shape (see learningFields.ts),
 * so a "move" is: read the source at depth 0 (relationships come back as bare
 * ids, which is what create() wants), recreate it under `tutorials` with the
 * same slug, then delete the original. Idempotent — a doc already moved is
 * skipped, and re-running does not duplicate.
 *
 *   pnpm tsx scripts/moveResourcesToTutorials.ts
 *
 * Targets the same Neon instance production uses, so the change is live
 * immediately. ESP32-CAM is deliberately NOT in the list — it stays a Resource.
 */
import 'dotenv/config'
import type { Tutorial } from '@/payload/payload-types'
import config from '@payload-config'
import { getPayload } from 'payload'

/** Fields Payload assigns; everything else on a doc is editor-authored. */
type ManagedFields = 'id' | '_order' | 'createdAt' | 'updatedAt'

/** Slugs to move out of `resources` and into `tutorials`. */
const SLUGS_TO_MOVE = ['esp32-setup', 'raspberry-pi-345-setup']

async function main() {
  const payload = await getPayload({ config })

  for (const slug of SLUGS_TO_MOVE) {
    const inResources = await payload.find({
      collection: 'resources',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    const alreadyMoved = await payload.find({
      collection: 'tutorials',
      where: { slug: { equals: slug } },
      limit: 1,
      overrideAccess: true,
    })

    if (alreadyMoved.docs.length > 0) {
      // Already a tutorial. If a resource copy still lingers (an interrupted
      // earlier run), remove it so the two collections don't both claim it.
      if (inResources.docs.length > 0) {
        await payload.delete({
          collection: 'resources',
          id: inResources.docs[0].id,
          overrideAccess: true,
        })
        console.log(`Removed leftover resource copy of "${slug}".`)
      } else {
        console.log(`"${slug}" is already a tutorial. Skipping.`)
      }
      continue
    }

    if (inResources.docs.length === 0) {
      console.log(`"${slug}" not found in resources. Skipping.`)
      continue
    }

    const source = inResources.docs[0]
    const sourceId = source.id

    // Strip the fields Payload owns; carry everything the editor authored.
    // `_order` is dropped too: it is the orderable rank, unique within a
    // collection, so the destination assigns a fresh appended rank rather than
    // inheriting the source's.
    const { id, _order, createdAt, updatedAt, ...rest } = source as unknown as Record<
      string,
      unknown
    >

    const created = await payload.create({
      collection: 'tutorials',
      // Resources and Tutorials share a field shape (learningFields.ts), so a
      // resource's authored fields are exactly a tutorial's create payload.
      data: rest as Omit<Tutorial, ManagedFields>,
      overrideAccess: true,
    })
    console.log(`Created tutorial ${created.id} ("${slug}").`)

    await payload.delete({ collection: 'resources', id: sourceId, overrideAccess: true })
    console.log(`Deleted resource ${sourceId} ("${slug}").`)
  }

  console.log('Done.')
}

main()
  .then(() => process.stdout.write('', () => process.exit(0)))
  .catch((err) => {
    console.error(err)
    process.stdout.write('', () => process.exit(1))
  })
