import type { Block } from 'payload'

/**
 * The rich-content block palette shared by Resources, Tutorials, and Simulators.
 * Lives in its own module so those collections can share a field factory
 * without importing each other.
 */

/**
 * TextBlock: Rich formatted content with text styling
 */
export const TextBlock: Block = {
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
export const CodeBlock: Block = {
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
export const TableBlock: Block = {
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
export const GraphBlock: Block = {
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
        { label: 'draw.io Diagram', value: 'drawio' },
        { label: 'Chart Data (JSON)', value: 'chartData' },
        { label: 'Custom HTML', value: 'html' },
      ],
      admin: {
        description: 'Type of graph or diagram to display',
      },
    },
    {
      name: 'drawioUrl',
      label: 'draw.io Share Link or Image URL',
      type: 'text',
      required: false,
      admin: {
        description:
          'Draw your diagram free at https://app.diagrams.net — no account needed. Then either: (1) File → Publish → Link, and paste that link here, or (2) File → Export as → SVG/PNG, upload it as an Image Block instead. Both work on desktop and mobile.',
        placeholder: 'https://viewer.diagrams.net/?...  or  https://.../diagram.svg',
        // `siblingData`, not `data`: inside a block, `data` is the whole
        // document, so `data.graphType` is always undefined and the field
        // stays hidden no matter what is selected. Every condition below had
        // that bug, which is why the Graph block only ever showed its type and
        // caption.
        condition: (_data, siblingData) => siblingData?.graphType === 'drawio',
      },
    },
    {
      name: 'mermaidDefinition',
      type: 'textarea',
      required: false,
      admin: {
        description: 'Mermaid diagram syntax (e.g., graph TD, flowchart, etc.)',
        condition: (_data, siblingData) => siblingData?.graphType === 'mermaid',
      },
    },
    {
      name: 'chartData',
      type: 'json',
      required: false,
      admin: {
        description: 'Chart data in JSON format (Chart.js compatible)',
        condition: (_data, siblingData) => siblingData?.graphType === 'chartData',
      },
    },
    {
      name: 'html',
      type: 'code',
      required: false,
      admin: {
        description: 'Custom HTML for embedding (use with caution)',
        condition: (_data, siblingData) => siblingData?.graphType === 'html',
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
export const ImageBlock: Block = {
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
 * VideoBlock: An embedded YouTube video.
 *
 * Stores the URL an editor pastes from the browser rather than a bare video id —
 * asking for an id means explaining where to find one. The id is parsed at
 * render time, which also accepts youtu.be, /embed/, /shorts/, and /live/ forms.
 */
export const VideoBlock: Block = {
  slug: 'videoBlock',
  interfaceName: 'VideoBlock',
  labels: {
    singular: 'Video Block',
    plural: 'Video Blocks',
  },
  fields: [
    {
      name: 'url',
      label: 'YouTube URL',
      type: 'text',
      required: true,
      admin: {
        description:
          'Paste any YouTube link — watch, share (youtu.be), Shorts, or live. The player appears on the page automatically.',
        placeholder: 'https://www.youtube.com/watch?v=...',
      },
    },
    {
      name: 'caption',
      type: 'text',
      required: false,
      admin: {
        description: 'Optional caption shown under the video',
      },
    },
  ],
}

/**
 * SimulatorLinkBlock: Link to an interactive simulator
 */
export const SimulatorLinkBlock: Block = {
  slug: 'simulatorLinkBlock',
  interfaceName: 'SimulatorLinkBlock',
  labels: {
    singular: 'Simulator Link Block',
    plural: 'Simulator Link Blocks',
  },
  fields: [
    {
      name: 'simulator',
      type: 'relationship',
      relationTo: 'simulators',
      required: true,
      admin: {
        description: 'Select the simulator to link to',
      },
    },
    {
      name: 'buttonText',
      type: 'text',
      defaultValue: 'Launch Simulator',
      admin: {
        description: 'Text to display on the action button',
      },
    },
  ],
}

/**
 * RowBlock: Layout container for horizontal grouping of other blocks
 * Note: Does NOT include nested RowBlocks to avoid infinite recursion
 */
export const RowBlock: Block = {
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
      blocks: [
        TextBlock,
        CodeBlock,
        TableBlock,
        GraphBlock,
        ImageBlock,
        VideoBlock,
        SimulatorLinkBlock,
      ],
      admin: {
        description: 'Blocks to display in this row (nested RowBlocks not supported)',
      },
    },
  ],
}
