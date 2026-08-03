import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "resources_blocks_accordion_block_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"summary" varchar,
  	"default_open" boolean DEFAULT false
  );
  
  CREATE TABLE "resources_blocks_accordion_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "tutorials_blocks_accordion_block_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"summary" varchar,
  	"default_open" boolean DEFAULT false
  );
  
  CREATE TABLE "tutorials_blocks_accordion_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "resources_blocks_accordion_block_items" ADD CONSTRAINT "resources_blocks_accordion_block_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."resources_blocks_accordion_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "resources_blocks_accordion_block" ADD CONSTRAINT "resources_blocks_accordion_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tutorials_blocks_accordion_block_items" ADD CONSTRAINT "tutorials_blocks_accordion_block_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tutorials_blocks_accordion_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tutorials_blocks_accordion_block" ADD CONSTRAINT "tutorials_blocks_accordion_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tutorials"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "resources_blocks_accordion_block_items_order_idx" ON "resources_blocks_accordion_block_items" USING btree ("_order");
  CREATE INDEX "resources_blocks_accordion_block_items_parent_id_idx" ON "resources_blocks_accordion_block_items" USING btree ("_parent_id");
  CREATE INDEX "resources_blocks_accordion_block_order_idx" ON "resources_blocks_accordion_block" USING btree ("_order");
  CREATE INDEX "resources_blocks_accordion_block_parent_id_idx" ON "resources_blocks_accordion_block" USING btree ("_parent_id");
  CREATE INDEX "resources_blocks_accordion_block_path_idx" ON "resources_blocks_accordion_block" USING btree ("_path");
  CREATE INDEX "tutorials_blocks_accordion_block_items_order_idx" ON "tutorials_blocks_accordion_block_items" USING btree ("_order");
  CREATE INDEX "tutorials_blocks_accordion_block_items_parent_id_idx" ON "tutorials_blocks_accordion_block_items" USING btree ("_parent_id");
  CREATE INDEX "tutorials_blocks_accordion_block_order_idx" ON "tutorials_blocks_accordion_block" USING btree ("_order");
  CREATE INDEX "tutorials_blocks_accordion_block_parent_id_idx" ON "tutorials_blocks_accordion_block" USING btree ("_parent_id");
  CREATE INDEX "tutorials_blocks_accordion_block_path_idx" ON "tutorials_blocks_accordion_block" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "resources_blocks_accordion_block_items" CASCADE;
  DROP TABLE "resources_blocks_accordion_block" CASCADE;
  DROP TABLE "tutorials_blocks_accordion_block_items" CASCADE;
  DROP TABLE "tutorials_blocks_accordion_block" CASCADE;`)
}
