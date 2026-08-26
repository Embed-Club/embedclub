import type { CollectionConfig } from 'payload'

import { buildLearningFields, buildLearningPreview, learningHooks } from './learningFields'

export const Resources: CollectionConfig = {
  slug: 'resources',
  access: {
    read: () => true, // Public can read resources
  },
  // Drag rows in the list view to arrange them. The frontend renders in this
  // order, top-first - no date sorting, the arrangement in the admin is the
  // published order.
  orderable: true,
  admin: {
    useAsTitle: 'title',
    description:
      'Reference material and guides. Drag rows to set the order they appear on the site.',
    defaultColumns: ['title', 'difficulty', 'badge', 'updatedAt'],
    group: 'Resources',
    ...buildLearningPreview('resources'),
  },
  fields: buildLearningFields({ noun: 'Resource' }),
  hooks: learningHooks,
}
