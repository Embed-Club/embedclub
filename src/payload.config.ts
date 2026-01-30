// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { mcpPlugin } from '@payloadcms/plugin-mcp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import {Achievements} from './collections/Achievements'
import { Events } from './collections/Events'
import { MemberCategories } from './collections/MemberCategories'
import { MemberRoles } from './collections/MemberRoles'
import {Members} from './collections/Members'
import {MemberPhoto} from './collections/MemberPhoto'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Achievements, Events, MemberCategories, MemberPhoto, MemberRoles, Members],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  sharp,
  plugins: [
  mcpPlugin({
    collections: {
      // Enable MCP for Users collection
      users: {
        enabled: {
          find: true,    // Allow reading users
          create: true,  // Allow creating users
          update: true,  // Allow updating users
          delete: false  // Disable deleting users (for safety)
        },
        description: 'User accounts and authentication data for the Embed Club members'
      },
      // Enable MCP for Media collection
      media: {
        enabled: {
          find: true,
          create: true,
          update: true,
          delete: false
        },
        description: 'Media files including images and documents uploaded to the Embed Club'
      },
      // Enable MCP for Achievements collection
      achievements: {
        enabled: {
          find: true,
          create: true,
          update: true,
          delete: false
        },
        description: 'Member achievements and milestones in the Embed Club'
      },
      // Enable MCP for Events collection
      events: {
        enabled: {
          find: true,
          create: true,
          update: true,
          delete: false
        },
        description: 'Embed Club events including workshops, meetings, and activities'
      },
    }
  })
]
})
