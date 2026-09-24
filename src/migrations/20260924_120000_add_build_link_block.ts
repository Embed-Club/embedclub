import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds the Build Page Link block to Resources and Tutorials - a card that
 * opens a board's in-browser editor on /build. Same table shape as the
 * Simulator Link block, pointing at `build_targets` instead of `simulators`.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE "resources_blocks_build_link_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"build_target_id" integer NOT NULL,
  	"block_name" varchar
  );

  CREATE TABLE "tutorials_blocks_build_link_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"build_target_id" integer NOT NULL,
  	"block_name" varchar
  );

  ALTER TABLE "resources_blocks_build_link_block" ADD CONSTRAINT "resources_blocks_build_link_block_build_target_id_build_targets_id_fk" FOREIGN KEY ("build_target_id") REFERENCES "public"."build_targets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "resources_blocks_build_link_block" ADD CONSTRAINT "resources_blocks_build_link_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tutorials_blocks_build_link_block" ADD CONSTRAINT "tutorials_blocks_build_link_block_build_target_id_build_targets_id_fk" FOREIGN KEY ("build_target_id") REFERENCES "public"."build_targets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tutorials_blocks_build_link_block" ADD CONSTRAINT "tutorials_blocks_build_link_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tutorials"("id") ON DELETE cascade ON UPDATE no action;

  CREATE INDEX "resources_blocks_build_link_block_order_idx" ON "resources_blocks_build_link_block" USING btree ("_order");
  CREATE INDEX "resources_blocks_build_link_block_parent_id_idx" ON "resources_blocks_build_link_block" USING btree ("_parent_id");
  CREATE INDEX "resources_blocks_build_link_block_path_idx" ON "resources_blocks_build_link_block" USING btree ("_path");
  CREATE INDEX "resources_blocks_build_link_block_build_target_idx" ON "resources_blocks_build_link_block" USING btree ("build_target_id");
  CREATE INDEX "tutorials_blocks_build_link_block_order_idx" ON "tutorials_blocks_build_link_block" USING btree ("_order");
  CREATE INDEX "tutorials_blocks_build_link_block_parent_id_idx" ON "tutorials_blocks_build_link_block" USING btree ("_parent_id");
  CREATE INDEX "tutorials_blocks_build_link_block_path_idx" ON "tutorials_blocks_build_link_block" USING btree ("_path");
  CREATE INDEX "tutorials_blocks_build_link_block_build_target_idx" ON "tutorials_blocks_build_link_block" USING btree ("build_target_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP TABLE IF EXISTS "resources_blocks_build_link_block" CASCADE;
  DROP TABLE IF EXISTS "tutorials_blocks_build_link_block" CASCADE;`)
}
