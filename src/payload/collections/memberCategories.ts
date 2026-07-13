import type { CollectionConfig } from 'payload'
import { createSortOrderBeforeChange } from '../hooks/resolveSortOrderConflicts'

export const MemberCategories: CollectionConfig = {
  slug: 'member-categories',
  admin: { useAsTitle: 'name' },
  access: { read: () => true },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.name && !data?.slug) {
          data.slug = data.name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '')
        }
        return data
      },
    ],
    beforeChange: [createSortOrderBeforeChange('member-categories')],
    afterChange: [
      async ({ doc, req }) => {
        // Check for duplicates after save and notify via context
        const allCategories = await req.payload.find({
          collection: 'member-categories',
          limit: 1000,
        })

        const sortOrderMap = new Map<number, string[]>()
        for (const cat of allCategories.docs) {
          const sortOrder = Number((cat as unknown as Record<string, unknown>)?.sortOrder)
          if (!Number.isNaN(sortOrder)) {
            if (!sortOrderMap.has(sortOrder)) {
              sortOrderMap.set(sortOrder, [])
            }
            sortOrderMap
              .get(sortOrder)
              ?.push(((cat as unknown as Record<string, unknown>)?.name as string) || 'Unnamed')
          }
        }

        // Check if there are duplicates
        const hasDuplicates = Array.from(sortOrderMap.values()).some((names) => names.length > 1)

        if (hasDuplicates) {
          // Store in context for client-side toast
          req.context = req.context || {}
          req.context.hasDuplicateSortOrders = true
        }

        return doc
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'description', type: 'textarea' },
    {
      name: 'sortOrder',
      type: 'number',
      required: true,
      admin: {
        description:
          'Order in which this category appears. Lower numbers appear first. Picking an occupied position swaps with (or shifts) the other category automatically.',
        components: {
          Field: '@/components/admin/sortOrderSelectCategory',
        },
      },
    },
  ],
}
