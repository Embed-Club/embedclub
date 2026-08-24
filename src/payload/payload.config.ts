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
import { FormMedia } from './collections/formMedia'
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
import { LegalPages } from './globals/legalPages'
import { SupportPages } from './globals/supportPages'

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
      // Otherwise the tab icon stays payload-favicon-*.png. Paired light/dark
      // the way Payload does its own: the dark-artwork mark is the default, and
      // the light one takes over under a dark browser theme.
      icons: [
        { rel: 'icon', type: 'image/svg+xml', url: '/embedClubLogo-Light.svg' },
        {
          rel: 'icon',
          type: 'image/svg+xml',
          url: '/embedClubLogo-Dark.svg',
          media: '(prefers-color-scheme: dark)',
        },
      ],
      // openGraph does not inherit `description` above - left alone it keeps
      // advertising Payload ("a headless CMS and application framework...")
      // in og:description, twitter:description and the generated og:image.
      openGraph: {
        siteName: 'Embed Club',
        title: 'Embed Club Admin',
        description: 'Admin panel for the Embed Club website.',
      },
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
    FormMedia,
    // Library
    Media,
    Tags,
    // System
    Users,
  ],
  globals: [AboutPage, LegalPages, SupportPages, HomeFeaturedMembers],
  // "Payload Settings" on the account view is a translation string, not config,
  // so the admin.meta rebrand can't reach it. Overrides merge over the defaults.
  i18n: {
    translations: {
      en: {
        general: {
          payloadSettings: 'Embed Club Settings',
        },
      },
    },
  },
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
    // mode push schema diffs - it fights the migrations and corrupts state.
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
        // members export responses to CSV/JSON straight from the list view -
        // which is most of why a Google Sheet mirror was wanted.
        { slug: 'form-submissions' },
      ],
    }),
    // S3 is opt-in via env, not tied to NODE_ENV - so a local production build
    // (`next build && next start`) still stores uploads on disk. Set
    // USE_S3_STORAGE=true in the real deployment environment.
    ...(process.env.USE_S3_STORAGE === 'true'
      ? [
          s3Storage({
            collections: {
              media: true,
              'member-photo': true,
              gallery: true,
              // member-authored form artwork only. Files respondents upload
              // never touch this bucket - they go to Google Drive.
              'form-media': true,
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
