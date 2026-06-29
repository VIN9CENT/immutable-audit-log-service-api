import { pgTable, uuid, text, jsonb, timestamp, index } from "drizzle-orm/pg-core";

export const events = pgTable("events", {
  id: uuid("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull(),
  actor_id: text("actor_id").notNull(),
  action: text("action").notNull(),
  resource_type: text("resource_type").notNull(),
  resource_id: text("resource_id").notNull(),
  before_state: jsonb("before_state"),
  after_state: jsonb("after_state"),
  ip_address: text("ip_address"),
  user_agent: text("user_agent"),
  signature: text("signature").notNull(),
}, (table) => [
  index("idx_actor_id").on(table.actor_id),
  index("idx_action").on(table.action),
  index("idx_resource_type").on(table.resource_type),
  index("idx_resource_id").on(table.resource_id),
  index("idx_timestamp").on(table.timestamp),
])

export type NewEvent = typeof events.$inferInsert;
export type Event = typeof events.$inferSelect;