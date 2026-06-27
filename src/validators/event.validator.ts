import { z } from "zod";

export const createEventSchema = z.object({
  actor_id: z
    .string({
      error: "actor_id is required",
    })
    .min(1, "actor_id is required"),

  action: z
    .string({
      error: "action is required",
    })
    .min(1, "action is required"),

  resource_type: z
    .string({
      error: "resource_type is required",
    })
    .min(1, "resource_type is required"),

  resource_id: z
    .string({
      error: "resource_id is required",
    })
    .min(1, "resource_id is required"),

  before_state: z.record(z.string(), z.unknown()).nullable().optional(),
  after_state: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const createBulkEventSchema = z.array(createEventSchema).min(1, "Batch must contain at least one event.").max(100, "Batch cannot exceed 100 events.")

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type CreateBulkInput = z.infer<typeof createBulkEventSchema>