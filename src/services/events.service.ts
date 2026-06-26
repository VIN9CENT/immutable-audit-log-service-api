import type { CreateEventInput } from "../validators/event.validator";
import type { StoredEvent } from "../types/event";
import { saveEvent } from "../repositories/events.repository";

export function recordEvent(input: CreateEventInput): StoredEvent {
  const event: StoredEvent = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    actor_id: input.actor_id,
    action: input.action,
    resource_type: input.resource_type,
    resource_id: input.resource_id,
    before_state: input.before_state,
    after_state: input.after_state,
    ip_address: input.ip_address,
    user_agent: input.user_agent,
  };

  return saveEvent(event);
}