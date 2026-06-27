import type { CreateEventInput } from "../validators/event.validator";
import type { NewEvent, Event } from "../db/schema";
import { psqlEventRepository } from "../repositories/events.repository";

type EventMeta = {
  ip_address: string | null;
  user_agent: string | null;
}

export async function recordEvent(input: CreateEventInput, meta: EventMeta): Promise<Event> {
  const event: NewEvent = {
    actor_id: input.actor_id,
    action: input.action,
    resource_type: input.resource_type,
    resource_id: input.resource_id,
    before_state: input.before_state ?? null,
    after_state: input.after_state ?? null,
    ip_address: meta.ip_address,
    user_agent: meta.user_agent,
    signature: '', // placeholder — HMAC signing comes in next phase
  };

  return await psqlEventRepository(event);
}