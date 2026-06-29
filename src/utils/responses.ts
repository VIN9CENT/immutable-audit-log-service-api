import type { Event } from "../db/schema";
import type { QueryResult } from '../repositories/events.repository'

export type ApiError = {
  field: string;
  message: string;
  code: string;
};

export type SafeEvent = Omit<Event, 'signature'>

export type EventResponse = {
  ok: boolean;
  event: SafeEvent | null;
  errors: ApiError[];
};

export function eventSuccessResponse(event: Event): EventResponse {
  const { signature, ...safeEvent } = event
  return {
    ok: true,
    event: safeEvent,
    errors: [],
  };
}

export function eventErrorResponse(errors: ApiError[]): EventResponse {
  return {
    ok: false,
    event: null,
    errors,
  };
}

export function eventsSuccessResponse(result: QueryResult) {
  const { events, ...pagination } = result
  return {
    ok: true,
    events: events.map(({ signature: _signature, ...safeEvent }) => safeEvent),
    ...pagination,
    errors: [],
  }
}

export function bulkEventSuccessResponse(events: Event[]) {
  return {
    ok: true,
    inserted: events.length,
    events: events.map(({ signature: _signature, ...safeEvent }) => safeEvent),
    errors: [],
  }
}