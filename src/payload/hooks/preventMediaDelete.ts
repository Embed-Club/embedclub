import { sql } from '@payloadcms/db-postgres'
import { APIError, type CollectionBeforeDeleteHook } from 'payload'

type MediaReference = {
  label: string
}

/**
 * Prevent a Media delete from reaching the database when a required content
 * field still points at it. Those foreign keys currently use SET NULL, while
 * the required fields are NOT NULL, which otherwise produces a generic 500
 * after PostgreSQL aborts the transaction.
 */
export const preventMediaDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const references = await req.payload.db.drizzle.execute<MediaReference>(sql`
    SELECT 'Achievement image' AS label
    FROM achievements
    WHERE image_id = ${id}
    UNION ALL
    SELECT 'Event image' AS label
    FROM events
    WHERE image_id = ${id}
    UNION ALL
    SELECT 'Resource thumbnail' AS label
    FROM resources
    WHERE thumbnail_id = ${id}
    UNION ALL
    SELECT 'Resource image block' AS label
    FROM resources_blocks_image_block
    WHERE image_id = ${id}
    UNION ALL
    SELECT 'Tutorial thumbnail' AS label
    FROM tutorials
    WHERE thumbnail_id = ${id}
    UNION ALL
    SELECT 'Tutorial image block' AS label
    FROM tutorials_blocks_image_block
    WHERE image_id = ${id}
    UNION ALL
    SELECT 'Simulator thumbnail' AS label
    FROM simulators
    WHERE thumbnail_id = ${id}
    UNION ALL
    SELECT 'Simulator image block' AS label
    FROM simulators_blocks_image_block
    WHERE image_id = ${id}
    UNION ALL
    SELECT 'Project image block' AS label
    FROM projects_blocks_image_block
    WHERE image_id = ${id}
    UNION ALL
    SELECT 'Build target thumbnail' AS label
    FROM build_targets
    WHERE thumbnail_id = ${id}
    UNION ALL
    SELECT 'About page image block' AS label
    FROM about_page_blocks_about_image_block
    WHERE image_id = ${id}
    LIMIT 5
  `)

  if (references.rows.length > 0) {
    const labels = references.rows.map(({ label }) => label).join(', ')
    throw new APIError(
      `Cannot delete this image because it is used by: ${labels}. Replace or remove those references first.`,
      409,
    )
  }
}
