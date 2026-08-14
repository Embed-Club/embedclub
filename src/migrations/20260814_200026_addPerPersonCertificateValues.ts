import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_forms_certificate_placeholders_source" ADD VALUE 'perPerson';
  CREATE TABLE "form_submissions_certificate_values" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"value" varchar NOT NULL
  );
  
  ALTER TABLE "forms_certificate_placeholders" ADD COLUMN "default_value" varchar;
  ALTER TABLE "form_submissions_certificate_values" ADD CONSTRAINT "form_submissions_certificate_values_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."form_submissions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "form_submissions_certificate_values_order_idx" ON "form_submissions_certificate_values" USING btree ("_order");
  CREATE INDEX "form_submissions_certificate_values_parent_id_idx" ON "form_submissions_certificate_values" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "form_submissions_certificate_values" CASCADE;
  ALTER TABLE "forms_certificate_placeholders" ALTER COLUMN "source" SET DATA TYPE text;
  ALTER TABLE "forms_certificate_placeholders" ALTER COLUMN "source" SET DEFAULT 'question'::text;
  DROP TYPE "public"."enum_forms_certificate_placeholders_source";
  CREATE TYPE "public"."enum_forms_certificate_placeholders_source" AS ENUM('question', 'fixed');
  ALTER TABLE "forms_certificate_placeholders" ALTER COLUMN "source" SET DEFAULT 'question'::"public"."enum_forms_certificate_placeholders_source";
  ALTER TABLE "forms_certificate_placeholders" ALTER COLUMN "source" SET DATA TYPE "public"."enum_forms_certificate_placeholders_source" USING "source"::"public"."enum_forms_certificate_placeholders_source";
  ALTER TABLE "forms_certificate_placeholders" DROP COLUMN "default_value";`)
}
