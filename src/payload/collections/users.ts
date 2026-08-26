import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    group: 'Library & System',
    description: 'Admin logins. Add new ones with scripts/createBackupAdmin.ts.',
  },
  auth: true,
  access: {
    // Accounts are provisioned out-of-band (scripts/createBackupAdmin.ts) so a
    // compromised session cannot mint itself a second admin, and so the club
    // never accumulates stale logins. `create: () => false` blocks the REST,
    // GraphQL, and Local API paths alike - the seed script sets
    // `overrideAccess: true` to get past it deliberately.
    create: () => false,
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    // Deleting the last admin would lock everyone out of the panel; deletion is
    // a DB-level operation on purpose.
    delete: () => false,
  },
  fields: [
    // Email + password come from `auth: true`.
  ],
}
