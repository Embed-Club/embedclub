import type { GlobalConfig } from 'payload'

/** Cap a hasMany relationship at `max` selections. */
const capAt =
  (max: number) =>
  (value: unknown): true | string =>
    Array.isArray(value) && value.length > max ? `Select at most ${max} members.` : true

/**
 * Curated members shown on the home page as category-driven rows. For each row
 * you pick a member category, then the members from that category to feature.
 * Rows render top → bottom in order; each row's label is the category name.
 */
export const HomeFeaturedMembers: GlobalConfig = {
  slug: 'home-featured-members',
  label: 'Home · Featured Members',
  admin: { group: 'Members' },
  access: { read: () => true },
  fields: [
    {
      name: 'rows',
      type: 'array',
      label: 'Rows',
      maxRows: 5,
      admin: {
        description:
          'Each row is a category plus the members to feature from it. Rows show top → bottom.',
      },
      fields: [
        {
          name: 'category',
          type: 'relationship',
          relationTo: 'member-categories',
          required: true,
          admin: { description: 'The row label + which members you can pick below.' },
        },
        {
          name: 'members',
          type: 'relationship',
          relationTo: 'members',
          hasMany: true,
          required: true,
          validate: capAt(8),
          // Restrict the picker to members in the row's selected category.
          filterOptions: ({ siblingData }) => {
            const categoryId = (siblingData as { category?: number | string } | undefined)?.category
            if (!categoryId) return true
            return { category: { equals: categoryId } }
          },
          admin: { description: 'Members to show in this row (order = display order, up to 8).' },
        },
      ],
    },
  ],
}
