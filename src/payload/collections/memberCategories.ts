import type { CollectionConfig } from 'payload'
import { createSortOrderBeforeChange } from '../hooks/resolveSortOrderConflicts'

export const MemberCategories: CollectionConfig = {
  slug: 'member-categories',
  admin: { useAsTitle: 'name', group: 'Members' },
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
    { name: 'name', type: 'text', required: true, unique: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'description', type: 'textarea' },
    {
      // Per category, not global: Alumni reads best with the most recent batch
      // at the top, while a current-members category usually wants the founding
      // batch first. One switch for the whole page would force one of the two.
      name: 'batchOrder',
      label: 'Batch Order',
      type: 'select',
      required: true,
      defaultValue: 'oldestFirst',
      options: [
        { label: 'Oldest batch first (2016 – 2020 … )', value: 'oldestFirst' },
        { label: 'Latest batch first ( … 2016 – 2020)', value: 'newestFirst' },
      ],
      admin: {
        description:
          'Which batch heading appears at the top of this category on the members page. Members inside a batch are always ordered by role.',
      },
    },
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
