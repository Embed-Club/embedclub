import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Make a database built from these migrations match production.
 *
 * Two changes had been applied to production by hand and never written down,
 * so `payload migrate` against an empty database produced a schema the app
 * cannot actually run on. Found by doing exactly that and diffing the result
 * against production.
 *
 * 1. `gallery.title` - the initial setup created it NOT NULL. When Gallery
 *    became an upload collection in July its only field became `caption`, and
 *    the column was dropped from production directly. On a fresh database it
 *    survived, and every gallery upload failed on a not-null violation.
 *
 * 2. `home_featured_members` and its two child tables - the global was added
 *    straight to production in SQL. No migration created them, so a fresh
 *    database had no tables behind the home page's featured members section.
 *
 * Written to be a no-op against production and corrective everywhere else,
 * which is why each statement is guarded.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "gallery" DROP COLUMN IF EXISTS "title";

  CREATE TABLE IF NOT EXISTS "home_featured_members" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );

  CREATE TABLE IF NOT EXISTS "home_featured_members_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"category_id" integer NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "home_featured_members_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"members_id" integer
  );`)

  // Constraints have no IF NOT EXISTS in Postgres, so each is added only when
  // it is missing - production already has all of them.
  await db.execute(sql`
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'home_featured_members_rows__parent_id_fkey') THEN
      ALTER TABLE "home_featured_members_rows" ADD CONSTRAINT "home_featured_members_rows__parent_id_fkey" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_featured_members"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'home_featured_members_rows_category_id_fkey') THEN
      ALTER TABLE "home_featured_members_rows" ADD CONSTRAINT "home_featured_members_rows_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."member_categories"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'home_featured_members_rels_parent_id_fkey') THEN
      ALTER TABLE "home_featured_members_rels" ADD CONSTRAINT "home_featured_members_rels_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."home_featured_members"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'home_featured_members_rels_members_id_fkey') THEN
      ALTER TABLE "home_featured_members_rels" ADD CONSTRAINT "home_featured_members_rels_members_id_fkey" FOREIGN KEY ("members_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;`)

  await db.execute(sql`
  CREATE INDEX IF NOT EXISTS "home_featured_members_rows_order_idx" ON "home_featured_members_rows" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "home_featured_members_rows_parent_id_idx" ON "home_featured_members_rows" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "home_featured_members_rows_category_idx" ON "home_featured_members_rows" USING btree ("category_id");
  CREATE INDEX IF NOT EXISTS "home_featured_members_rels_order_idx" ON "home_featured_members_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "home_featured_members_rels_parent_idx" ON "home_featured_members_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "home_featured_members_rels_path_idx" ON "home_featured_members_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "home_featured_members_rels_members_id_idx" ON "home_featured_members_rels" USING btree ("members_id");`)
}

/**
 * Deliberately not symmetric. Rolling this back would drop the tables holding
 * the home page's featured members - real content on production - to restore a
 * state that was only ever an accident. The gallery column is not restored for
 * the same reason: nothing reads it.
 */
export async function down(_args: MigrateDownArgs): Promise<void> {
  // Intentionally empty.
}
