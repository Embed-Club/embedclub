import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// The index is "projects_order_idx", not the "projects__order_idx" the
// generator emitted from the drizzle snapshot — the live index was created
// under the older name. IF EXISTS on the way out so this applies against either.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX IF EXISTS "projects_order_idx";
  DROP INDEX IF EXISTS "projects__order_idx";
  ALTER TABLE "projects" DROP COLUMN IF EXISTS "_order";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projects" ADD COLUMN "_order" varchar;
  CREATE INDEX "projects_order_idx" ON "projects" USING btree ("_order");`)
}
