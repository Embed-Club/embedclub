import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { s3Storage } from '@payloadcms/storage-s3'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Achievements } from './collections/achievements'
import { Audio, AudioFiles } from './collections/audio'
import { Events } from './collections/events'
import { FormSubmissions } from './collections/formSubmissions'
import { Forms } from './collections/forms'
import { Gallery } from './collections/gallery'
import { Media } from './collections/media'
import { MemberCategories } from './collections/memberCategories'
import { MemberPhoto } from './collections/memberPhoto'
import { MemberRoles } from './collections/memberRoles'
import { Members } from './collections/members'
import { Resources } from './collections/resources'
import { Simulators } from './collections/simulators'
import { Tags } from './collections/tags'
import { Users } from './collections/users'
import { AboutPage } from './globals/aboutPage'
import { FeedbackPage } from './globals/feedbackPage'

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
    Forms,
    FormSubmissions,
    Resources,
    Simulators,
    Tags,
  ],
  globals: [AboutPage, FeedbackPage],
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
              'audio-files': true,
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
    // mcpPlugin({
    //   collections: {
    //     ...
    //   },
    // }),
  ],
})
