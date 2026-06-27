import type { CreateBulkInput, CreateEventInput } from "../validators/event.validator";
import type { NewEvent, Event } from "../db/schema";
import { psqlEventRepository, getEvents, getEventById, psqlBulkEventRepository } from "../repositories/events.repository";
import type { FilterType, QueryResult } from "../repositories/events.repository";

type EventMeta = {
  ip_address: string | null;
  user_agent: string | null;
}

export const recordEvent = async (input: CreateEventInput, meta: EventMeta): Promise<Event> => {
  const event: NewEvent = {
    actor_id: input.actor_id,
    action: input.action,
    resource_type: input.resource_type,
    resource_id: input.resource_id,
    before_state: input.before_state ?? null,
    after_state: input.after_state ?? null,
    ip_address: meta.ip_address,
    user_agent: meta.user_agent,
    signature: '',
  };

  return await psqlEventRepository(event);
}

export const recordBulkEvents = async (input:CreateBulkInput, meta:EventMeta):Promise<Event[]> => {
const newEvents = input.map((item) => ({
  actor_id: item.actor_id,
  action: item.action,
  resource_type: item.resource_type,
  resource_id: item.resource_id,
  before_state: item.before_state ?? null,
  after_state: item.after_state ?? null,
  ip_address: meta.ip_address,
  user_agent: meta.user_agent,
  signature: '',
}))

return await psqlBulkEventRepository(newEvents)
}



export const fetchEvents = async (filters: FilterType): Promise<QueryResult> => {
  return await getEvents(filters)
}

export const fetchEventById = async (id: string): Promise<Event | null> => {
  return await getEventById(id)
}