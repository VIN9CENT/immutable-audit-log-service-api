import { z } from "zod";

export const createEventSchema = z.object({
  actor_id: z.string({
    error: "actor_id is required",
  }).min(1, "actor_id is required"),

  action: z.string({
    error: "action is required",
  }).min(1, "action is required"),

  resource_type: z.string({
    error: "resource_type is required",
  }).min(1, "resource_type is required"),

  resource_id: z.string({
    error: "resource_id is required",
  }).min(1, "resource_id is required"),

  before_state: z.record(z.string(), z.unknown()).optional(),
  after_state: z.record(z.string(), z.unknown()).optional(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;