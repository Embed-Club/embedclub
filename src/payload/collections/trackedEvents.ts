import type { CollectionConfig } from 'payload'

/**
 * Click counts for the handful of actions Vercel Web Analytics cannot see.
 *
 * Page views already come from Vercel for free, so nothing here duplicates a
 * navigation. What is left is what happens *without* a page load: launching an
 * external simulator, copying a code block, tapping an email address. Custom
 * events on Vercel need a Pro plan; this is the free equivalent, in the
 * database the club already runs.
 *
 * Deliberately anonymous. No visitor id, no session, no cookie, no IP, no user
 * agent - a row is "this action happened, on this path, at this time", and two
 * rows cannot be tied to the same person. That is what lets the privacy policy
 * keep saying the site does not track you.
 *
 * Rows are only written by `/api/track` through the local API with
 * `overrideAccess`, never by the REST/GraphQL endpoints - hence `create: false`
 * here alongside a public route.
 */
export const TrackedEvents: CollectionConfig = {
  slug: 'tracked-events',
  admin: {
    useAsTitle: 'name',
    description:
      'Anonymous counts for actions that do not load a page (simulator launches, code copies, contact taps). No visitor information is stored.',
    defaultColumns: ['name', 'detail', 'path', 'createdAt'],
    group: 'Library & System',
  },
  access: {
    // Admins read the counts; nothing writes through the API surface.
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      index: true,
      admin: {
        readOnly: true,
        description: 'Event name, from the allowlist in lib/trackEvent.',
      },
    },
    {
      name: 'detail',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'What it happened to - a simulator slug, a code language.',
      },
    },
    {
      name: 'path',
      type: 'text',
      index: true,
      admin: {
        readOnly: true,
        description: 'Page the action happened on.',
      },
    },
  ],
  timestamps: true,
}

export default TrackedEvents
