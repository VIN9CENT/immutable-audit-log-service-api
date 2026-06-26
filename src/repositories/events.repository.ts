import type { StoredEvent } from "../types/event";

const events: StoredEvent[] = [];

export function saveEvent(event: StoredEvent): StoredEvent {
  events.push(event);
  return event;
}

export function getAllEvents(): StoredEvent[] {
  return events;
}