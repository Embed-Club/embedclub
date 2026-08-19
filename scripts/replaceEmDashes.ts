/**
 * Replace em dashes with a plain hyphen across every text column in the
 * database.
 *
 *   pnpm tsx scripts/replaceEmDashes.ts            # dry run, writes nothing
 *   pnpm tsx scripts/replaceEmDashes.ts --apply    # writes
 *
 * Runs straight against Postgres rather than through Payload: the copy lives in
 * text, varchar and Lexical jsonb columns spread over a hundred-odd tables, and
 * a plain `replace()` reaches all of them without loading and re-saving every
 * document. Lexical is stored as jsonb, so the replace runs on its text form
 * and is cast back - the tree is untouched apart from the character itself.
 *
 * The DB is shared between local and production, so a run here is live. Dry run
 * first and read the counts.
 */
import 'dotenv/config'
import config from '@payload-config'
import { getPayload } from 'payload'

/** Just the shape used here, so the script needn't depend on `pg` for types. */
interface Pool {
  query: (text: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>
  end: () => Promise<void>
}

// Written as an escape, not the literal character: a repo-wide sweep for the
// same character would otherwise rewrite this line and make the script a no-op.
const EM_DASH = '—'
const REPLACEMENT = '-'

const APPLY = process.argv.includes('--apply')

const COLUMNS_SQL = `
  SELECT c.table_name, c.column_name, c.data_type
  FROM information_schema.columns c
  JOIN information_schema.tables t
    ON t.table_schema = c.table_schema AND t.table_name = c.table_name
  WHERE c.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND c.data_type IN ('text', 'character varying', 'jsonb')
    AND c.is_updatable = 'YES'
  ORDER BY c.table_name, c.column_name
`

async function main() {
  // Payload's Postgres adapter already holds a pool wired to DATABASE_URI, so
  // this borrows it rather than adding `pg` as a direct dependency.
  const payload = await getPayload({ config })
  const pool = (payload.db as unknown as { pool: Pool }).pool

  const { rows } = await pool.query(COLUMNS_SQL)
  const columns = rows as unknown as {
    table_name: string
    column_name: string
    data_type: string
  }[]

  // jsonb has no `like`, so a jsonb column is matched and replaced through its
  // text form; the cast back is what gets stored.
  const matchExpr = (col: (typeof columns)[number]) =>
    col.data_type === 'jsonb' ? `"${col.column_name}"::text` : `"${col.column_name}"`

  // One round trip per column would be ~860 of them against a remote database.
  // The counts go out as a handful of UNION ALL batches instead.
  const BATCH = 60
  let affectedRows = 0
  const hits: { table: string; column: string; type: string; rows: number }[] = []

  for (let i = 0; i < columns.length; i += BATCH) {
    const batch = columns.slice(i, i + BATCH)
    const sql = batch
      .map(
        (col, j) =>
          `SELECT ${i + j} AS idx, count(*)::int AS n FROM "${col.table_name}" WHERE ${matchExpr(col)} LIKE $1`,
      )
      .join(' UNION ALL ')
    const counted = await pool.query(sql, [`%${EM_DASH}%`])

    for (const row of counted.rows as unknown as { idx: number; n: number }[]) {
      if (row.n === 0) continue
      const col = columns[row.idx]
      hits.push({
        table: col.table_name,
        column: col.column_name,
        type: col.data_type,
        rows: row.n,
      })
      affectedRows += row.n
    }
  }

  if (APPLY) {
    for (const hit of hits) {
      const col = columns.find((c) => c.table_name === hit.table && c.column_name === hit.column)
      if (!col) continue
      const ref = `"${col.column_name}"`
      const value =
        col.data_type === 'jsonb'
          ? `replace(${ref}::text, $1, $2)::jsonb`
          : `replace(${ref}, $1, $2)`
      await pool.query(
        `UPDATE "${col.table_name}" SET ${ref} = ${value} WHERE ${matchExpr(col)} LIKE $3`,
        [EM_DASH, REPLACEMENT, `%${EM_DASH}%`],
      )
      console.log(`updated ${hit.table}.${hit.column} (${hit.rows} rows)`)
    }
  }

  for (const h of hits) {
    console.log(`${h.table}.${h.column} (${h.type}): ${h.rows} rows`)
  }
  console.log(`\ncolumns scanned:   ${columns.length}`)
  console.log(`columns with em dash: ${hits.length}`)
  console.log(`rows affected:     ${affectedRows}`)
  console.log(APPLY ? '\nApplied.' : '\nDry run - nothing written. Re-run with --apply.')

  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
