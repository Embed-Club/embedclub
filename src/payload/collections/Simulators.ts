import type { CollectionConfig } from 'payload'
import {
  TextBlock,
  CodeBlock,
  TableBlock,
  GraphBlock,
  ImageBlock,
  RowBlock,
  SimulatorLinkBlock,
} from './Resources'

export const Simulators: CollectionConfig = {
  slug: 'simulators',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'category', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'slug',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Microcontrollers', value: 'microcontrollers' },
        { label: 'Protocols', value: 'protocols' },
        { label: 'RTOS', value: 'rtos' },
        { label: 'Peripherals', value: 'peripherals' },
        { label: 'Architecture', value: 'architecture' },
      ],
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
    },
    {
      name: 'difficulty',
      type: 'select',
      defaultValue: 'beginner',
      options: [
        { label: 'Beginner', value: 'beginner' },
        { label: 'Intermediate', value: 'intermediate' },
        { label: 'Advanced', value: 'advanced' },
      ],
    },
    {
      name: 'estimatedTime',
      type: 'number',
      admin: {
        description: 'Estimated time to complete in minutes',
      },
    },
    {
      name: 'content',
      type: 'blocks',
      blocks: [
        TextBlock,
        CodeBlock,
        TableBlock,
        GraphBlock,
        ImageBlock,
        RowBlock,
        SimulatorLinkBlock,
      ].filter(Boolean), // Remove any undefined blocks
    },
    {
      name: 'iframeUrl',
      type: 'text',
      admin: {
        description: 'URL of the interactive simulator iframe',
      },
    },
  ],
}
