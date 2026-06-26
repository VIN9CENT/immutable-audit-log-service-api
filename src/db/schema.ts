import { pgTable, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  actor_id: text("actor_id").notNull(),
  action: text("action").notNull(),
  resource_type: text("resource_type").notNull(),
  resource_id: text("resource_id").notNull(),
  before_state: jsonb("before_state"),
  after_state: jsonb("after_state"),
  ip_address: text("ip_address"),
  user_agent: text("user_agent"),
  signature: text("signature").notNull(),
});

export type NewEvent = typeof events.$inferInsert;
export type Event = typeof events.$inferSelect;
