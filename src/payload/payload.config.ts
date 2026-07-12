import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { s3Storage } from '@payloadcms/storage-s3'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Achievements } from './collections/Achievements'
import { Audio, AudioFiles } from './collections/Audio'
import { Events } from './collections/Events'
import { FeedbackForms } from './collections/FeedbackForms'
import { Gallery } from './collections/Gallery'
import { AboutPage } from './globals/AboutPage'
import { FeedbackPage } from './globals/FeedbackPage'
import { Media } from './collections/Media'
import { MemberCategories } from './collections/MemberCategories'
import { MemberPhoto } from './collections/MemberPhoto'
import { MemberRoles } from './collections/MemberRoles'
import { Members } from './collections/Members'
import { Resources } from './collections/Resources'
import { Simulators } from './collections/Simulators'
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
    FeedbackForms,
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
  }),
  sharp,
  plugins: [
    ...(process.env.NODE_ENV === 'production'
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
