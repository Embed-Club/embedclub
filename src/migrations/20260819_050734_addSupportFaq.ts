import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "support_pages_support_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" jsonb NOT NULL
  );
  
  ALTER TABLE "support_pages_support_faq" ADD CONSTRAINT "support_pages_support_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."support_pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "support_pages_support_faq_order_idx" ON "support_pages_support_faq" USING btree ("_order");
  CREATE INDEX "support_pages_support_faq_parent_id_idx" ON "support_pages_support_faq" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "support_pages_support_faq" CASCADE;`)
}
