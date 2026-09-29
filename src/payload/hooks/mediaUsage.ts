import { sql } from '@payloadcms/db-postgres'
import type { PayloadRequest } from 'payload'

export type MediaUsage = {
  id: number | string
  imageName: string
  location: string
}

type MediaUsageRow = {
  id: number
  imageName: string
  location: string
}

/**
 * Finds every content record that points at one of the selected media files.
 * This is shared by the admin confirmation dialog and the API tests so the
 * warning always describes the same references that PostgreSQL will null on
 * delete.
 */
export async function findMediaUsage(
  ids: Array<number | string>,
  req: PayloadRequest,
): Promise<MediaUsage[]> {
  if (ids.length === 0) return []

  const references = await req.payload.db.drizzle.execute<MediaUsageRow>(sql`
    SELECT media.id, media.filename AS "imageName", 'Achievement: ' || achievements.title AS location
    FROM media
    JOIN achievements ON achievements.image_id = media.id
    WHERE media.id IN ${sql.join(
      ids.map((id) => sql`${id}`),
      sql`, `,
    )}
    UNION ALL
    SELECT media.id, media.filename, 'Event: ' || events.title
    FROM media
    JOIN events ON events.image_id = media.id
    WHERE media.id IN ${sql.join(
      ids.map((id) => sql`${id}`),
      sql`, `,
    )}
    UNION ALL
    SELECT media.id, media.filename, 'Resource: ' || resources.title || ' (thumbnail)'
    FROM media
    JOIN resources ON resources.thumbnail_id = media.id
    WHERE media.id IN ${sql.join(
      ids.map((id) => sql`${id}`),
      sql`, `,
    )}
    UNION ALL
    SELECT media.id, media.filename, 'Resource: ' || resources.title || ' (content image)'
    FROM media
    JOIN resources_blocks_image_block block ON block.image_id = media.id
    JOIN resources ON resources.id = block._parent_id
    WHERE media.id IN ${sql.join(
      ids.map((id) => sql`${id}`),
      sql`, `,
    )}
    UNION ALL
    SELECT media.id, media.filename, 'Tutorial: ' || tutorials.title || ' (thumbnail)'
    FROM media
    JOIN tutorials ON tutorials.thumbnail_id = media.id
    WHERE media.id IN ${sql.join(
      ids.map((id) => sql`${id}`),
      sql`, `,
    )}
    UNION ALL
    SELECT media.id, media.filename, 'Tutorial: ' || tutorials.title || ' (content image)'
    FROM media
    JOIN tutorials_blocks_image_block block ON block.image_id = media.id
    JOIN tutorials ON tutorials.id = block._parent_id
    WHERE media.id IN ${sql.join(
      ids.map((id) => sql`${id}`),
      sql`, `,
    )}
    UNION ALL
    SELECT media.id, media.filename, 'Simulator: ' || simulators.title || ' (thumbnail)'
    FROM media
    JOIN simulators ON simulators.thumbnail_id = media.id
    WHERE media.id IN ${sql.join(
      ids.map((id) => sql`${id}`),
      sql`, `,
    )}
    UNION ALL
    SELECT media.id, media.filename, 'Simulator: ' || simulators.title || ' (content image)'
    FROM media
    JOIN simulators_blocks_image_block block ON block.image_id = media.id
    JOIN simulators ON simulators.id = block._parent_id
    WHERE media.id IN ${sql.join(
      ids.map((id) => sql`${id}`),
      sql`, `,
    )}
    UNION ALL
    SELECT media.id, media.filename, 'Project: ' || projects.title || ' (content image)'
    FROM media
    JOIN projects_blocks_image_block block ON block.image_id = media.id
    JOIN projects ON projects.id = block._parent_id
    WHERE media.id IN ${sql.join(
      ids.map((id) => sql`${id}`),
      sql`, `,
    )}
    UNION ALL
    SELECT media.id, media.filename, 'Project: ' || projects.title || ' (thumbnail)'
    FROM media
    JOIN projects ON projects.thumbnail_id = media.id
    WHERE media.id IN ${sql.join(
      ids.map((id) => sql`${id}`),
      sql`, `,
    )}
    UNION ALL
    SELECT media.id, media.filename, 'Build target: ' || build_targets.title
    FROM media
    JOIN build_targets ON build_targets.thumbnail_id = media.id
    WHERE media.id IN ${sql.join(
      ids.map((id) => sql`${id}`),
      sql`, `,
    )}
    UNION ALL
    SELECT media.id, media.filename, 'About page (banner background)'
    FROM media
    JOIN about_page_blocks_banner_block block ON block.background_image_id = media.id
    WHERE media.id IN ${sql.join(
      ids.map((id) => sql`${id}`),
      sql`, `,
    )}
    UNION ALL
    SELECT media.id, media.filename, 'About page (image block)'
    FROM media
    JOIN about_page_blocks_about_image_block block ON block.image_id = media.id
    WHERE media.id IN ${sql.join(
      ids.map((id) => sql`${id}`),
      sql`, `,
    )}
    ORDER BY "imageName", location
  `)

  return references.rows
}
