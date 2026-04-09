import path from 'node:path'
import { fileURLToPath } from 'node:url'
// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Achievements } from './collections/Achievements'
import { Audio, AudioFiles } from './collections/Audio'
import { Events } from './collections/Events'
import { Gallery } from './collections/Gallery'
import { Media } from './collections/Media'
import { MemberCategories } from './collections/MemberCategories'
import { MemberPhoto } from './collections/MemberPhoto'
import { MemberRoles } from './collections/MemberRoles'
import { Members } from './collections/Members'
import { Resources } from './collections/Resources'
import { Tags } from './collections/Tags'
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
    AudioFiles,
    Audio,
    Achievements,
    Events,
    MemberCategories,
    MemberPhoto,
    MemberRoles,
    Members,
    Gallery,
    Resources,
    Tags,
  ],
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
            find: true, // Allow reading users
            create: true, // Allow creating users
            update: true, // Allow updating users
            delete: false, // Disable deleting users (for safety)
          },
          description: 'User accounts and authentication data for the Embed Club members',
        },
        // Enable MCP for Media collection
        media: {
          enabled: {
            find: true,
            create: true,
            update: true,
            delete: false,
          },
          description: 'Media files including images and documents uploaded to the Embed Club',
        },
        // Enable MCP for Achievements collection
        achievements: {
          enabled: {
            find: true,
            create: true,
            update: true,
            delete: false,
          },
          description: 'Member achievements and milestones in the Embed Club',
        },
        // Enable MCP for Events collection
        events: {
          enabled: {
            find: true,
            create: true,
            update: true,
            delete: false,
          },
          description: 'Embed Club events including workshops, meetings, and activities',
        },
      },
    }),
  ],
})
