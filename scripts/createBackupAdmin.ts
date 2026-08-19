/**
 * Create (or reset the password of) a Payload admin login.
 *
 * The `users` collection blocks `create` for everyone (see
 * src/payload/collections/users.ts), so the admin panel cannot mint new
 * accounts. This script is the one deliberate way in: it uses the Local API
 * with `overrideAccess: true`.
 *
 * Usage - set the two vars in your environment, never in a file that is
 * committed, then run `pnpm create:admin`.
 *
 * On Windows PowerShell:
 *
 *   $env:BACKUP_ADMIN_EMAIL="..."; $env:BACKUP_ADMIN_PASSWORD="..."
 *   pnpm create:admin
 *
 * It targets whatever DATABASE_URL points at - check that first, because the
 * repo's local .env points at production.
 */
import 'dotenv/config'
import config from '@payload-config'
import { getPayload } from 'payload'

async function main() {
  const email = process.env.BACKUP_ADMIN_EMAIL
  const password = process.env.BACKUP_ADMIN_PASSWORD

  if (!email || !password) {
    throw new Error('Set BACKUP_ADMIN_EMAIL and BACKUP_ADMIN_PASSWORD before running this script.')
  }
  if (password.length < 12) {
    throw new Error('Use a password of at least 12 characters for an admin account.')
  }

  const payload = await getPayload({ config })

  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  })

  if (existing.docs.length > 0) {
    const id = existing.docs[0].id
    await payload.update({
      collection: 'users',
      id,
      data: { password },
      overrideAccess: true,
    })
    console.log(`Password reset for existing admin ${email} (id ${id}).`)
  } else {
    const created = await payload.create({
      collection: 'users',
      data: { email, password },
      overrideAccess: true,
    })
    console.log(`Created admin ${email} (id ${created.id}).`)
  }

  const total = await payload.count({ collection: 'users', overrideAccess: true })
  console.log(`Admin accounts now on this database: ${total.totalDocs}`)

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
