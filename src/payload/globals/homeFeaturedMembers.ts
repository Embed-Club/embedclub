import type { GlobalConfig } from 'payload'

/** Cap a hasMany relationship at `max` selections. */
const capAt =
  (max: number) =>
  (value: unknown): true | string =>
    Array.isArray(value) && value.length > max ? `Select at most ${max} members.` : true

/**
 * Curated members shown on the home page, in three ordered rows. The section
 * renders top → bottom in this field order; drag to reorder within a row.
 */
export const HomeFeaturedMembers: GlobalConfig = {
  slug: 'home-featured-members',
  label: 'Home · Featured Members',
  admin: { group: 'Pages' },
  access: { read: () => true },
  fields: [
    {
      name: 'coordinators',
      label: 'Top row · Coordinators (max 2)',
      type: 'relationship',
      relationTo: 'members',
      hasMany: true,
      validate: capAt(2),
      admin: { description: 'Top row. Order here is the display order (max 2).' },
    },
    {
      name: 'core',
      label: 'Middle row · Core team (max 4)',
      type: 'relationship',
      relationTo: 'members',
      hasMany: true,
      validate: capAt(4),
      admin: { description: 'Middle row (max 4).' },
    },
    {
      name: 'alumni',
      label: 'Bottom row · Alumni (max 4)',
      type: 'relationship',
      relationTo: 'members',
      hasMany: true,
      validate: capAt(4),
      admin: { description: 'Bottom row. Any batch/year (max 4).' },
    },
  ],
}
