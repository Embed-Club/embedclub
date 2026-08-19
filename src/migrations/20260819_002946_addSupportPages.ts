import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "support_pages_blocks_legal_heading_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "support_pages_blocks_legal_text_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" jsonb NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "support_pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"support_title" varchar DEFAULT 'Support' NOT NULL,
  	"support" jsonb,
  	"contact_title" varchar DEFAULT 'Contact' NOT NULL,
  	"contact_email" varchar,
  	"contact_phone" varchar,
  	"contact" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "support_pages_blocks_legal_heading_block" ADD CONSTRAINT "support_pages_blocks_legal_heading_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."support_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "support_pages_blocks_legal_text_block" ADD CONSTRAINT "support_pages_blocks_legal_text_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."support_pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "support_pages_blocks_legal_heading_block_order_idx" ON "support_pages_blocks_legal_heading_block" USING btree ("_order");
  CREATE INDEX "support_pages_blocks_legal_heading_block_parent_id_idx" ON "support_pages_blocks_legal_heading_block" USING btree ("_parent_id");
  CREATE INDEX "support_pages_blocks_legal_heading_block_path_idx" ON "support_pages_blocks_legal_heading_block" USING btree ("_path");
  CREATE INDEX "support_pages_blocks_legal_text_block_order_idx" ON "support_pages_blocks_legal_text_block" USING btree ("_order");
  CREATE INDEX "support_pages_blocks_legal_text_block_parent_id_idx" ON "support_pages_blocks_legal_text_block" USING btree ("_parent_id");
  CREATE INDEX "support_pages_blocks_legal_text_block_path_idx" ON "support_pages_blocks_legal_text_block" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "support_pages_blocks_legal_heading_block" CASCADE;
  DROP TABLE "support_pages_blocks_legal_text_block" CASCADE;
  DROP TABLE "support_pages" CASCADE;`)
}
