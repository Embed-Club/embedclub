import type { CollectionConfig } from 'payload'

import { buildLearningFields, buildLearningPreview, learningHooks } from './learningFields'

/**
 * Step-by-step tutorials. Same document shape as Resources - they were one
 * collection split by a `type` select until 2026-07-28.
 */
export const Tutorials: CollectionConfig = {
  slug: 'tutorials',
  access: {
    read: () => true,
  },
  orderable: true,
  admin: {
    useAsTitle: 'title',
    description: 'Step-by-step walkthroughs. Drag rows to set the order they appear on the site.',
    defaultColumns: ['title', 'difficulty', 'badge', 'updatedAt'],
    group: 'Tutorials',
    ...buildLearningPreview('tutorials'),
  },
  fields: buildLearningFields({ noun: 'Tutorial' }),
  hooks: learningHooks,
}
