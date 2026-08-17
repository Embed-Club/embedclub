import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "legal_pages_blocks_legal_heading_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "legal_pages_blocks_legal_text_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" jsonb NOT NULL,
  	"block_name" varchar
  );
  
  ALTER TABLE "legal_pages_blocks_legal_heading_block" ADD CONSTRAINT "legal_pages_blocks_legal_heading_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."legal_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "legal_pages_blocks_legal_text_block" ADD CONSTRAINT "legal_pages_blocks_legal_text_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."legal_pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "legal_pages_blocks_legal_heading_block_order_idx" ON "legal_pages_blocks_legal_heading_block" USING btree ("_order");
  CREATE INDEX "legal_pages_blocks_legal_heading_block_parent_id_idx" ON "legal_pages_blocks_legal_heading_block" USING btree ("_parent_id");
  CREATE INDEX "legal_pages_blocks_legal_heading_block_path_idx" ON "legal_pages_blocks_legal_heading_block" USING btree ("_path");
  CREATE INDEX "legal_pages_blocks_legal_text_block_order_idx" ON "legal_pages_blocks_legal_text_block" USING btree ("_order");
  CREATE INDEX "legal_pages_blocks_legal_text_block_parent_id_idx" ON "legal_pages_blocks_legal_text_block" USING btree ("_parent_id");
  CREATE INDEX "legal_pages_blocks_legal_text_block_path_idx" ON "legal_pages_blocks_legal_text_block" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "legal_pages_blocks_legal_heading_block" CASCADE;
  DROP TABLE "legal_pages_blocks_legal_text_block" CASCADE;`)
}
