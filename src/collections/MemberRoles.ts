// src/collections/MemberRoles.ts
import type { CollectionConfig } from 'payload'

export const MemberRoles: CollectionConfig = {
  slug: 'member-roles',
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
          const count = await req.payload.count({ collection: 'member-roles' })
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
        const allRoles = await req.payload.find({
          collection: 'member-roles',
          limit: 1000,
        })

        const sortOrderMap = new Map<number, string[]>()
        allRoles.docs.forEach((role: any) => {
          const sortOrder = Number(role?.sortOrder)
          if (!Number.isNaN(sortOrder)) {
            if (!sortOrderMap.has(sortOrder)) {
              sortOrderMap.set(sortOrder, [])
            }
            sortOrderMap.get(sortOrder)!.push(role?.name || 'Unnamed')
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
        description: 'Order in which this role appears. Lower numbers appear first. Occupied positions will be automatically reassigned.',
        components: {
          Field: '@/components/admin/SortOrderSelectRole',
        },
      },
    },
  ],
}