import type { Block, CollectionConfig } from 'payload'

/**
 * Generate a URL-friendly slug from text
 * Converts: "Raspberry Pi Setup Guide" -> "raspberry-pi-setup-guide"
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * TextBlock: Rich formatted content with text styling
 */
const TextBlock: Block = {
  slug: 'textBlock',
  interfaceName: 'TextBlock',
  labels: {
    singular: 'Text Block',
    plural: 'Text Blocks',
  },
  fields: [
    {
      name: 'text',
      type: 'richText',
      required: true,
      admin: {
        description: 'Formatted text content with support for bold, italic, lists, and more',
      },
    },
  ],
}

/**
 * CodeBlock: Syntax-highlighted code snippets
 */
const CodeBlock: Block = {
  slug: 'codeBlock',
  interfaceName: 'CodeBlock',
  labels: {
    singular: 'Code Block',
    plural: 'Code Blocks',
  },
  fields: [
    {
      name: 'language',
      type: 'select',
      required: true,
      options: [
        { label: 'JavaScript', value: 'javascript' },
        { label: 'TypeScript', value: 'typescript' },
        { label: 'Python', value: 'python' },
        { label: 'Java', value: 'java' },
        { label: 'C++', value: 'cpp' },
        { label: 'C#', value: 'csharp' },
        { label: 'Go', value: 'go' },
        { label: 'Rust', value: 'rust' },
        { label: 'Ruby', value: 'ruby' },
        { label: 'PHP', value: 'php' },
        { label: 'Swift', value: 'swift' },
        { label: 'Kotlin', value: 'kotlin' },
        { label: 'HTML', value: 'html' },
        { label: 'CSS', value: 'css' },
        { label: 'SQL', value: 'sql' },
        { label: 'Bash', value: 'bash' },
        { label: 'YAML', value: 'yaml' },
        { label: 'JSON', value: 'json' },
        { label: 'Markdown', value: 'markdown' },
        { label: 'XML', value: 'xml' },
      ],
      admin: {
        description: 'Programming language for syntax highlighting',
      },
    },
    {
      name: 'code',
      type: 'code',
      required: true,
      admin: {
        description: 'Paste or write your code here',
      },
    },
    {
      name: 'caption',
      type: 'text',
      required: false,
      admin: {
        description: 'Optional caption or file name to display above the code',
      },
    },
  ],
}

/**
 * TableBlock: Structured data in rows and columns
 */
const TableBlock: Block = {
  slug: 'tableBlock',
  interfaceName: 'TableBlock',
  labels: {
    singular: 'Table Block',
    plural: 'Table Blocks',
  },
  fields: [
    {
      name: 'headers',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'header',
          type: 'text',
          required: true,
          admin: {
            placeholder: 'e.g., Name, Type, Description',
          },
        },
      ],
      admin: {
        description: 'Column headers for the table',
      },
    },
    {
      name: 'rows',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'cells',
          type: 'array',
          required: true,
          fields: [
            {
              name: 'cell',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
      admin: {
        description: 'Table rows and cells',
      },
    },
  ],
}

/**
 * GraphBlock: Charts and diagrams via Mermaid or JSON data
 */
const GraphBlock: Block = {
  slug: 'graphBlock',
  interfaceName: 'GraphBlock',
  labels: {
    singular: 'Graph/Diagram Block',
    plural: 'Graph/Diagram Blocks',
  },
  fields: [
    {
      name: 'graphType',
      type: 'select',
      required: true,
      options: [
        { label: 'Mermaid Diagram', value: 'mermaid' },
        { label: 'Chart Data (JSON)', value: 'chartData' },
        { label: 'Custom HTML', value: 'html' },
      ],
      admin: {
        description: 'Type of graph or diagram to display',
      },
    },
    {
      name: 'mermaidDefinition',
      type: 'textarea',
      required: false,
      admin: {
        description: 'Mermaid diagram syntax (e.g., graph TD, flowchart, etc.)',
        condition: (data) => data?.graphType === 'mermaid',
      },
    },
    {
      name: 'chartData',
      type: 'json',
      required: false,
      admin: {
        description: 'Chart data in JSON format (Chart.js compatible)',
        condition: (data) => data?.graphType === 'chartData',
      },
    },
    {
      name: 'html',
      type: 'code',
      required: false,
      admin: {
        description: 'Custom HTML for embedding (use with caution)',
        condition: (data) => data?.graphType === 'html',
      },
    },
    {
      name: 'caption',
      type: 'text',
      required: false,
      admin: {
        description: 'Optional caption for the diagram',
      },
    },
  ],
}

/**
 * ImageBlock: Images with captions and metadata
 */
const ImageBlock: Block = {
  slug: 'imageBlock',
  interfaceName: 'ImageBlock',
  labels: {
    singular: 'Image Block',
    plural: 'Image Blocks',
  },
  fields: [
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description: 'Upload an image to display',
      },
    },
    {
      name: 'caption',
      type: 'text',
      required: false,
      admin: {
        description: 'Optional caption or alt text for the image',
      },
    },
    {
      name: 'size',
      type: 'select',
      options: [
        { label: 'Small (30%)', value: 'small' },
        { label: 'Medium (60%)', value: 'medium' },
        { label: 'Large (100%)', value: 'large' },
      ],
      defaultValue: 'large',
      admin: {
        description: 'Display width of the image',
      },
    },
  ],
}

/**
 * RowBlock: Layout container for horizontal grouping of other blocks
 * Note: Does NOT include nested RowBlocks to avoid infinite recursion
 */
const RowBlock: Block = {
  slug: 'rowBlock',
  interfaceName: 'RowBlock',
  labels: {
    singular: 'Row Block',
    plural: 'Row Blocks',
  },
  fields: [
    {
      name: 'columns',
      type: 'select',
      required: true,
      options: [
        { label: '1 Column (Full Width)', value: '1' },
        { label: '2 Columns', value: '2' },
        { label: '3 Columns', value: '3' },
      ],
      defaultValue: '2',
      admin: {
        description: 'Number of columns in this row',
      },
    },
    {
      name: 'blocks',
      type: 'blocks',
      required: false,
      blocks: [TextBlock, CodeBlock, TableBlock, GraphBlock, ImageBlock],
      admin: {
        description: 'Blocks to display in this row (nested RowBlocks not supported)',
      },
    },
  ],
}

export const Resources: CollectionConfig = {
  slug: 'resources',
  access: {
    read: () => true, // Public can read resources
  },
  admin: {
    useAsTitle: 'title',
    description: 'Technical learning resources with flexible content blocks',
    defaultColumns: ['title', 'difficulty', 'featured', 'createdAt'],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Basic Info',
          fields: [
            {
              name: 'title',
              label: 'Resource Title',
              type: 'text',
              required: true,
              admin: {
                placeholder: 'e.g., Raspberry Pi Setup Guide',
              },
            },
            {
              name: 'slug',
              type: 'text',
              required: true,
              unique: true,
              admin: {
                description:
                  'URL-friendly version (auto-generated from title, but you can edit it)',
                placeholder: 'Will auto-generate when you type the title',
              },
            },
            {
              name: 'description',
              label: 'Short Description',
              type: 'textarea',
              required: true,
              admin: {
                description: 'One-line summary shown in resource cards and previews',
              },
            },
            {
              name: 'thumbnail',
              label: 'Thumbnail Image',
              type: 'upload',
              relationTo: 'media',
              required: true,
              admin: {
                description: 'Image displayed in resource cards (1-2 sentence preview)',
              },
            },
          ],
        },
        {
          label: 'Metadata',
          fields: [
            {
              name: 'difficulty',
              type: 'select',
              required: true,
              options: [
                { label: 'Beginner', value: 'beginner' },
                { label: 'Intermediate', value: 'intermediate' },
                { label: 'Advanced', value: 'advanced' },
              ],
              defaultValue: 'beginner',
              admin: {
                description: 'Difficulty level for this resource',
              },
            },
            {
              name: 'tags',
              type: 'relationship',
              relationTo: 'tags',
              hasMany: true,
              required: false,
              admin: {
                description: 'Categorize this resource with tags (Python, React, Backend, etc.)',
              },
            },
            {
              name: 'estimatedReadTime',
              label: 'Estimated Read Time (minutes)',
              type: 'number',
              required: false,
              min: 1,
              max: 999,
              admin: {
                description: 'Approximate time to complete this resource',
                placeholder: '30',
              },
            },
            {
              name: 'featured',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description: 'Feature this resource on the homepage',
              },
            },
            {
              name: 'lastUpdated',
              type: 'date',
              required: false,
              admin: {
                description: 'When this resource was last updated',
              },
            },
          ],
        },
        {
          label: 'Content',
          fields: [
            {
              name: 'content',
              type: 'blocks',
              required: false,
              minRows: 0,
              blocks: [TextBlock, CodeBlock, TableBlock, GraphBlock, ImageBlock, RowBlock],
              admin: {
                description:
                  'Build your resource with flexible content blocks. Add text, code, tables, images, diagrams, and more.',
              },
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        // Auto-generate slug from title if slug is empty
        if (data?.title && !data?.slug) {
          data.slug = generateSlug(data.title)
        }
        return data
      },
    ],
  },
}
