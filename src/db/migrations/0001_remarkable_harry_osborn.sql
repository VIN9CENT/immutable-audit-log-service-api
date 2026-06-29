ALTER TABLE "events" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "timestamp" DROP DEFAULT;--> statement-breakpoint
CREATE INDEX "idx_actor_id" ON "events" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "idx_action" ON "events" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_resource_type" ON "events" USING btree ("resource_type");--> statement-breakpoint
CREATE INDEX "idx_resource_id" ON "events" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX "idx_timestamp" ON "events" USING btree ("timestamp");