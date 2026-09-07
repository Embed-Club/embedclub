import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "tracked_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"detail" varchar,
  	"path" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tracked_events_id" integer;
  CREATE INDEX "tracked_events_name_idx" ON "tracked_events" USING btree ("name");
  CREATE INDEX "tracked_events_path_idx" ON "tracked_events" USING btree ("path");
  CREATE INDEX "tracked_events_updated_at_idx" ON "tracked_events" USING btree ("updated_at");
  CREATE INDEX "tracked_events_created_at_idx" ON "tracked_events" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tracked_events_fk" FOREIGN KEY ("tracked_events_id") REFERENCES "public"."tracked_events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_tracked_events_id_idx" ON "payload_locked_documents_rels" USING btree ("tracked_events_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tracked_events" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "tracked_events" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_tracked_events_fk";
  
  DROP INDEX "payload_locked_documents_rels_tracked_events_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "tracked_events_id";`)
}
