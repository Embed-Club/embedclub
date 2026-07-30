import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Scheduled certificates can now go out in named batches at different times —
 * e.g. "Section A at 5pm, Section B at 9pm" — instead of one send time for
 * everyone. A batch is matched against one of the form's own questions
 * (`match_field` = the question's label, `match_value` = the expected
 * answer); the plain `certificate_send_at` remains the fallback for anyone
 * matched by no batch.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE "forms_certificate_batches" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"match_field" varchar NOT NULL,
  	"match_value" varchar NOT NULL,
  	"send_at" timestamp(3) with time zone NOT NULL
  );

  ALTER TABLE "forms_certificate_batches" ADD CONSTRAINT "forms_certificate_batches_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "forms_certificate_batches_order_idx" ON "forms_certificate_batches" USING btree ("_order");
  CREATE INDEX "forms_certificate_batches_parent_id_idx" ON "forms_certificate_batches" USING btree ("_parent_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP TABLE IF EXISTS "forms_certificate_batches" CASCADE;`)
}
