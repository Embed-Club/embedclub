import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * Snapshot baseline — intentionally does nothing to the database.
 *
 * Why it exists: drizzle generates each migration by diffing the current
 * Payload schema against the newest `*.json` snapshot in this folder. That
 * chain had gone stale — the last snapshot was 20260713_120901, while the ten
 * migrations after it were hand-written and shipped no snapshot. So
 * `migrate:create` was diffing today's schema against a July 13 picture of the
 * world: it proposed re-creating everything added since (tutorials, projects,
 * the reworked forms) and dropping everything removed since (audio, the
 * resources `type` select, simulator categories), and prompted to "rename"
 * enums that no longer exist into ones that already do. A migration accepted
 * from that diff would have dropped live tables.
 *
 * The fix is the companion `20260803_110000_drizzle_snapshot_baseline.json`: a
 * snapshot of the schema as it actually stands. It was generated with the stale
 * snapshots temporarily moved aside, so drizzle diffed from empty and had no
 * deletions to mis-attribute as renames. Future `migrate:create` runs diff
 * against that file and produce correct, promptless migrations.
 *
 * The generated `up()` was 1,596 lines of CREATE TABLE for a database that
 * already holds every one of those tables, so it is deliberately not kept. This
 * migration exists only to give the snapshot beside it a migration to belong
 * to — drizzle pairs each snapshot with a migration of the same name.
 */
export async function up(_args: MigrateUpArgs): Promise<void> {
  // No-op: the schema this baseline describes is already live.
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // No-op: nothing was applied, so there is nothing to roll back.
}
