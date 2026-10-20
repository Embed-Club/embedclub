/**
 * Read-only club data for Club Jarvis (the club's offline voice assistant).
 *
 * Why this exists rather than letting Jarvis call Payload's own REST API:
 * Jarvis runs a local model at `num_ctx: 4096`. A raw `/api/events` response
 * carries nested relationships and Lexical rich text as JSON trees, which
 * would fill that whole window before the model got to reason about it. Every
 * shape below is flattened and trimmed here, server-side, so a tool result
 * costs tens of tokens instead of thousands.
 *
 * Everything served here is already public on the site (each collection is
 * `read: () => true`). The token is not protecting secrets - it is there so
 * the assistant's traffic is identifiable, rate-limited and revocable without
 * touching the collections. `form-submissions` is deliberately absent: it
 * holds names, emails and certificate records, and is admins-only.
 */

import { getServerSideURL } from '@/lib/getUrl'
import { isRateLimited } from '@/lib/rateLimit'
import { richTextToPlainText } from '@/lib/structuredData'
import type { Payload } from 'payload'

/** A day's worth of questions from one kiosk, not a scrape. */
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 60

/** Caps on what one call can return, so a bad `limit` cannot flood the model. */
const DEFAULT_LIMIT = 5
const MAX_LIMIT = 25

/** Prose is for a spoken answer, not a page. Trim hard. */
const SUMMARY_MAX = 280
const DOCUMENT_MAX = 4000

export interface JarvisAuthFailure {
  response: Response
}

/**
 * Bearer-token check plus a per-caller rate limit.
 *
 * With `JARVIS_API_TOKEN` unset the whole surface answers 503 rather than
 * falling open - an unconfigured environment should not quietly start serving
 * an integration nobody set up.
 */
export async function authorizeJarvis(req: Request): Promise<JarvisAuthFailure | null> {
  const expected = process.env.JARVIS_API_TOKEN

  if (!expected) {
    return {
      response: Response.json(
        { error: 'Jarvis integration is not configured on this environment.' },
        { status: 503 },
      ),
    }
  }

  const presented = req.headers
    .get('authorization')
    ?.replace(/^Bearer\s+/i, '')
    .trim()

  if (!presented || presented !== expected) {
    return { response: Response.json({ error: 'Unauthorized.' }, { status: 401 }) }
  }

  // Keyed on the token, not the IP: the assistant may sit behind a changing
  // home address, and the token is what we would revoke anyway.
  const key = `jarvis:${presented.slice(0, 12)}`
  if (await isRateLimited({ key, windowMs: RATE_LIMIT_WINDOW_MS, max: RATE_LIMIT_MAX })) {
    return { response: Response.json({ error: 'Rate limited.' }, { status: 429 }) }
  }

  return null
}

/** Clamp a caller-supplied `limit` into something a 4k context can hold. */
export function readLimit(params: URLSearchParams): number {
  const raw = Number.parseInt(params.get('limit') ?? '', 10)
  if (!Number.isFinite(raw) || raw < 1) return DEFAULT_LIMIT
  return Math.min(raw, MAX_LIMIT)
}

function trim(text: string | null | undefined, max = SUMMARY_MAX): string {
  if (!text) return ''
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}...` : flat
}

/**
 * Flatten a `content` blocks array to plain text.
 *
 * Mirrors the walk in `richTextHeadings.collectHeadings` - only `textBlock`
 * carries prose, and `rowBlock` nests more blocks inside columns. Code, tables
 * and media blocks are skipped: a spoken answer cannot use them, and they are
 * the bulk of the bytes.
 */
export function blocksToPlainText(blocks: unknown): string {
  const out: string[] = []

  const walk = (list: unknown) => {
    if (!Array.isArray(list)) return
    for (const entry of list) {
      if (!entry || typeof entry !== 'object') continue
      const block = entry as Record<string, unknown>
      if (block.blockType === 'textBlock') out.push(richTextToPlainText(block.text))
      if (block.blockType === 'rowBlock') walk(block.blocks)
    }
  }

  walk(blocks)
  return out
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Pull `name` off a relationship that may still be an id at depth 0. */
function relationName(value: unknown): string {
  if (!value || typeof value !== 'object') return ''
  const record = value as Record<string, unknown>
  if (typeof record.name === 'string') return record.name
  if (typeof record.fullName === 'string') return record.fullName
  if (typeof record.title === 'string') return record.title
  return ''
}

function relationNames(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map(relationName).filter(Boolean)
}

/** Absolute links, so a spoken answer can be followed up on a phone. */
function siteUrl(): string {
  return getServerSideURL()
}

/**
 * One resource handler per thing Jarvis can ask about.
 *
 * The map doubles as the allowlist: the route only serves a key that appears
 * here, so adding a collection to the assistant is a deliberate edit rather
 * than a URL someone can guess.
 */
type JarvisHandler = (payload: Payload, params: URLSearchParams) => Promise<unknown>

export const jarvisResources: Record<string, JarvisHandler> = {
  /**
   * `?when=upcoming` (default) or `past`. Upcoming sorts soonest-first, which
   * is what "when is the next event" needs; past sorts most-recent-first.
   */
  events: async (payload, params) => {
    const past = params.get('when') === 'past'
    const now = new Date().toISOString()

    const { docs } = await payload.find({
      collection: 'events',
      limit: readLimit(params),
      depth: 0,
      sort: past ? '-eventDate' : 'eventDate',
      where: past ? { eventDate: { less_than: now } } : { eventDate: { greater_than_equal: now } },
    })

    return {
      events: docs.map((event) => ({
        title: event.title,
        category: event.category,
        date: event.eventDate,
        mode: event.eventMode === 'online' ? 'online' : 'in person',
        venue:
          [event.venue?.roomName, event.venue?.floor].filter(Boolean).join(', ') ||
          event.location?.address ||
          '',
        summary: trim(event.shortDescription) || trim(richTextToPlainText(event.description)),
        url: `${siteUrl()}/events/${event.slug}`,
      })),
    }
  },

  /**
   * `?role=<slug>` narrows to one role (president, secretary, ...), which is
   * how "who runs the club" gets answered without listing every member.
   */
  members: async (payload, params) => {
    const role = params.get('role')?.trim()

    const { docs } = await payload.find({
      collection: 'members',
      limit: readLimit(params),
      depth: 1,
      where: role ? { 'roles.slug': { equals: role } } : {},
    })

    return {
      members: docs.map((member) => ({
        name: member.fullName,
        roles: relationNames(member.roles),
        category: relationName(member.category),
        bio: trim(member.bio, 160),
        since: member.startYear,
        until: member.endYear ?? null,
        github: member.github || '',
      })),
    }
  },

  projects: async (payload, params) => {
    const { docs } = await payload.find({
      collection: 'projects',
      limit: readLimit(params),
      depth: 1,
      sort: '-year',
    })

    return {
      projects: docs.map((project) => ({
        title: project.title,
        year: project.year ?? null,
        award: project.award || '',
        summary: trim(project.description),
        team: relationNames(project.team),
        tags: relationNames(project.tags),
        repo: project.repoUrl || '',
        url: `${siteUrl()}/projects/${project.slug}`,
      })),
    }
  },

  resources: (payload, params) => learning(payload, params, 'resources'),
  tutorials: (payload, params) => learning(payload, params, 'tutorials'),

  achievements: async (payload, params) => {
    const { docs } = await payload.find({
      collection: 'achievements',
      limit: readLimit(params),
      depth: 0,
      sort: '-date',
    })

    return {
      achievements: docs.map((achievement) => ({
        title: achievement.title,
        date: achievement.date,
        summary: trim(richTextToPlainText(achievement.summary)),
      })),
    }
  },

  /**
   * A single compact call for the assistant's warm start: enough to answer
   * "what is on" and "how big is the club" without three round trips.
   */
  digest: async (payload) => {
    const now = new Date().toISOString()

    const [upcoming, members, projects] = await Promise.all([
      payload.find({
        collection: 'events',
        limit: 3,
        depth: 0,
        sort: 'eventDate',
        where: { eventDate: { greater_than_equal: now } },
      }),
      payload.count({ collection: 'members' }),
      payload.count({ collection: 'projects' }),
    ])

    return {
      generatedAt: now,
      memberCount: members.totalDocs,
      projectCount: projects.totalDocs,
      nextEvents: upcoming.docs.map((event) => ({
        title: event.title,
        date: event.eventDate,
        mode: event.eventMode === 'online' ? 'online' : 'in person',
      })),
    }
  },

  /**
   * The prose corpus for Jarvis's vector store - the long-form bodies that are
   * better retrieved and cited than fetched live. Shape matches what
   * `jarvis/data/base.Repository.get_club_documents` expects.
   */
  documents: async (payload, params) => {
    const limit = readLimit(params)

    const [about, resources, tutorials] = await Promise.all([
      payload.findGlobal({ slug: 'about-page', depth: 0 }),
      payload.find({ collection: 'resources', limit, depth: 0 }),
      payload.find({ collection: 'tutorials', limit, depth: 0 }),
    ])

    const documents: Array<Record<string, unknown>> = []

    const aboutText = [richTextToPlainText(about.content), aboutSectionsToPlainText(about.sections)]
      .filter(Boolean)
      .join('\n\n')

    if (aboutText) {
      documents.push({
        id: 'about',
        title: about.title || 'About Embed Club',
        kind: 'about',
        url: `${siteUrl()}/about`,
        updatedAt: about.updatedAt ?? '',
        text: trim(aboutText, DOCUMENT_MAX),
      })
    }

    for (const [kind, result] of [
      ['resource', resources],
      ['tutorial', tutorials],
    ] as const) {
      for (const doc of result.docs) {
        const body = blocksToPlainText(doc.content)
        documents.push({
          id: `${kind}-${doc.id}`,
          title: doc.title,
          kind,
          difficulty: doc.difficulty,
          url: doc.externalUrl || `${siteUrl()}/${kind}s/${doc.slug}`,
          updatedAt: doc.updatedAt,
          text: trim([doc.description, body].filter(Boolean).join('\n\n'), DOCUMENT_MAX),
        })
      }
    }

    return { documents }
  },
}

/** Resources and tutorials share `buildLearningFields`, so they shape alike. */
async function learning(
  payload: Payload,
  params: URLSearchParams,
  collection: 'resources' | 'tutorials',
) {
  const difficulty = params.get('difficulty')?.trim()

  const { docs } = await payload.find({
    collection,
    limit: readLimit(params),
    depth: 0,
    where: difficulty ? { difficulty: { equals: difficulty } } : {},
  })

  return {
    [collection]: docs.map((doc) => ({
      title: doc.title,
      difficulty: doc.difficulty,
      description: trim(doc.description),
      readTime: doc.estimatedReadTime ?? null,
      url: doc.externalUrl || `${siteUrl()}/${collection}/${doc.slug}`,
    })),
  }
}

/**
 * The about page's prose lives in `aboutTextBlock`, not the `textBlock` the
 * learning collections use, so it needs its own walk.
 */
function aboutSectionsToPlainText(sections: unknown): string {
  if (!Array.isArray(sections)) return ''
  const out: string[] = []
  for (const entry of sections) {
    if (!entry || typeof entry !== 'object') continue
    const block = entry as Record<string, unknown>
    if (block.blockType === 'aboutTextBlock') out.push(richTextToPlainText(block.text))
  }
  return out.join('\n\n').trim()
}
