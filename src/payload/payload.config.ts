import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { s3Storage } from '@payloadcms/storage-s3'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { importExportPlugin } from '@payloadcms/plugin-import-export'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Achievements } from './collections/achievements'
import { Events } from './collections/events'
import { FormSubmissions } from './collections/formSubmissions'
import { Forms } from './collections/forms'
import { Gallery } from './collections/gallery'
import { Media } from './collections/media'
import { MemberCategories } from './collections/memberCategories'
import { MemberPhoto } from './collections/memberPhoto'
import { MemberRoles } from './collections/memberRoles'
import { Members } from './collections/members'
import { Projects } from './collections/projects'
import { Resources } from './collections/resources'
import { Simulators } from './collections/simulators'
import { Tags } from './collections/tags'
import { Tutorials } from './collections/tutorials'
import { Users } from './collections/users'
import { AboutPage } from './globals/aboutPage'
import { HomeFeaturedMembers } from './globals/homeFeaturedMembers'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    // Payload brands the admin as its own otherwise: the login screen shows the
    // Payload wordmark and every tab title ends in "- Payload".
    meta: {
      titleSuffix: '- Embed Club',
      description: 'Admin panel for the Embed Club website.',
    },
    components: {
      graphics: {
        Logo: '@/components/admin/adminLogo',
        Icon: '@/components/admin/adminIcon',
      },
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  // Order here drives the order *within* each admin nav group (see each
  // collection's `admin.group`), so keep grouped collections adjacent.
  collections: [
    // Content
    Events,
    Achievements,
    Gallery,
    Resources,
    Tutorials,
    Simulators,
    Projects,
    // Members
    Members,
    MemberRoles,
    MemberCategories,
    MemberPhoto,
    // Forms
    Forms,
    FormSubmissions,
    // Library
    Media,
    Tags,
    // System
    Users,
  ],
  globals: [AboutPage, HomeFeaturedMembers],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    // Schema is migration-managed (see docs/SETUP.md §4). Never let dev/test
    // mode push schema diffs — it fights the migrations and corrupts state.
    push: false,
  }),
  sharp,
  plugins: [
    // Bulk operations: adds Export/Import (CSV + JSON) to these collections'
    // list views, so many docs can be added or updated in one go.
    importExportPlugin({
      collections: [
        { slug: 'members' },
        { slug: 'events' },
        { slug: 'achievements' },
        { slug: 'tags' },
        { slug: 'member-roles' },
        { slug: 'member-categories' },
        // Officers export responses to CSV/JSON straight from the list view —
        // which is most of why a Google Sheet mirror was wanted.
        { slug: 'form-submissions' },
      ],
    }),
    // S3 is opt-in via env, not tied to NODE_ENV — so a local production build
    // (`next build && next start`) still stores uploads on disk. Set
    // USE_S3_STORAGE=true in the real deployment environment.
    ...(process.env.USE_S3_STORAGE === 'true'
      ? [
          s3Storage({
            collections: {
              media: true,
              'member-photo': true,
              gallery: true,
            },
            bucket: process.env.S3_BUCKET || '',
            config: {
              endpoint: process.env.S3_ENDPOINT || '',
              region: process.env.S3_REGION || 'ap-southeast-1',
              credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
              },
              forcePathStyle: true,
            },
          }),
        ]
      : []),
  ],
})
