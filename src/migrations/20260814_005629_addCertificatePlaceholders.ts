import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_forms_certificate_placeholders_source" AS ENUM('question', 'fixed');
  CREATE TABLE "forms_certificate_placeholders" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"source" "enum_forms_certificate_placeholders_source" DEFAULT 'question',
  	"question_label" varchar,
  	"fixed_value" varchar
  );
  
  ALTER TABLE "forms_certificate_placeholders" ADD CONSTRAINT "forms_certificate_placeholders_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "forms_certificate_placeholders_order_idx" ON "forms_certificate_placeholders" USING btree ("_order");
  CREATE INDEX "forms_certificate_placeholders_parent_id_idx" ON "forms_certificate_placeholders" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "forms_certificate_placeholders" CASCADE;
  DROP TYPE "public"."enum_forms_certificate_placeholders_source";`)
}
