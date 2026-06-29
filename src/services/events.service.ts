import type {
  CreateBulkInput,
  CreateEventInput,
} from "../validators/event.validator";
import type { NewEvent, Event } from "../db/schema";
import {
  psqlEventRepository,
  getEvents,
  getEventById,
  psqlBulkEventRepository,
} from "../repositories/events.repository";
import type {
  FilterType,
  QueryResult,
} from "../repositories/events.repository";
import { generateSignature, type SignableEvent } from "./signature.service";
import { env } from "../env";
import { randomUUID } from "crypto";

type EventMeta = {
  ip_address: string | null;
  user_agent: string | null;
};

export const recordEvent = async (
  input: CreateEventInput,
  meta: EventMeta,
): Promise<Event> => {
  const id = randomUUID();
  const timestamp = new Date();

  const signable: SignableEvent = {
    id,
    timestamp,
    actor_id: input.actor_id,
    action: input.action,
    resource_type: input.resource_type,
    resource_id: input.resource_id,
    before_state: input.before_state ?? null,
    after_state: input.after_state ?? null,
  };

  const event: NewEvent = {
    id,
    timestamp,
    actor_id: input.actor_id,
    action: input.action,
    resource_type: input.resource_type,
    resource_id: input.resource_id,
    before_state: input.before_state ?? null,
    after_state: input.after_state ?? null,
    ip_address: meta.ip_address,
    user_agent: meta.user_agent,
    signature: generateSignature(signable, env.SERVER_SECRET!),
  };

  return await psqlEventRepository(event);
};

export const recordBulkEvents = async (
  input: CreateBulkInput,
  meta: EventMeta,
): Promise<Event[]> => {
  const newEvents: NewEvent[] = input.map((item) => {
    const id = randomUUID();
    const timestamp = new Date();

    const signable: SignableEvent = {
      id,
      timestamp,
      actor_id: item.actor_id,
      action: item.action,
      resource_type: item.resource_type,
      resource_id: item.resource_id,
      before_state: item.before_state ?? null,
      after_state: item.after_state ?? null,
    };

    return {
      id,
      timestamp,
      actor_id: item.actor_id,
      action: item.action,
      resource_type: item.resource_type,
      resource_id: item.resource_id,
      before_state: item.before_state ?? null,
      after_state: item.after_state ?? null,
      ip_address: meta.ip_address,
      user_agent: meta.user_agent,
      signature: generateSignature(signable, env.SERVER_SECRET!),
    };
  });

  return await psqlBulkEventRepository(newEvents);
};

export const verifyEvent = async (id: string): Promise<{ intact: boolean; event: Event } | null> => {
  const event = await getEventById(id)
  if (!event) return null

  const signable: SignableEvent = {
    id: event.id,
    timestamp: event.timestamp,
    actor_id: event.actor_id,
    action: event.action,
    resource_type: event.resource_type,
    resource_id: event.resource_id,
    before_state: event.before_state,
    after_state: event.after_state,
  }

  const recomputed = generateSignature(signable, env.SERVER_SECRET!)
  const intact = recomputed === event.signature

  return { intact, event }
}
export const fetchEvents = async (
  filters: FilterType,
): Promise<QueryResult> => {
  return await getEvents(filters);
};

export const fetchEventById = async (id: string): Promise<Event | null> => {
  return await getEventById(id);
};
