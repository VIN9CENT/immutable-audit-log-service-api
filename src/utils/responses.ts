import type { Event } from "../db/schema";

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