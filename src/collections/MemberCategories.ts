// src/collections/MemberCategories.ts
import type { CollectionConfig } from 'payload'

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
    beforeChange: [
      async ({ data, req, originalDoc }) => {
        // Normalize sortOrder coming from admin (can be string)
        let desiredSort: number | undefined | null = data.sortOrder as any
        if (typeof desiredSort === 'string') {
          const parsed = parseInt(desiredSort, 10)
          desiredSort = Number.isFinite(parsed) ? parsed : undefined
        }

        // If sortOrder not provided, assign next available
        if (desiredSort === undefined || desiredSort === null || Number.isNaN(desiredSort)) {
          const count = await req.payload.count({ collection: 'member-categories' })
          data.sortOrder = count.totalDocs + 1
        } else {
          data.sortOrder = desiredSort
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, req }) => {
        // Check for duplicates after save and notify via context
        const allCategories = await req.payload.find({
          collection: 'member-categories',
          limit: 1000,
        })

        const sortOrderMap = new Map<number, string[]>()
        allCategories.docs.forEach((cat: any) => {
          const sortOrder = Number(cat?.sortOrder)
          if (!Number.isNaN(sortOrder)) {
            if (!sortOrderMap.has(sortOrder)) {
              sortOrderMap.set(sortOrder, [])
            }
            sortOrderMap.get(sortOrder)!.push(cat?.name || 'Unnamed')
          }
        })

        // Check if there are duplicates
        const hasDuplicates = Array.from(sortOrderMap.values()).some(names => names.length > 1)
        
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
        description: 'Order in which this category appears. Lower numbers appear first. Occupied positions will be automatically reassigned.',
        components: {
          Field: '@/components/admin/SortOrderSelectCategory',
        },
      },
    },
  ],
}

