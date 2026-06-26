import type { StoredEvent } from "../types/event";

export type ApiError = {
  field: string;
  message: string;
  code: string;
};

export type EventResponse = {
  ok: boolean;
  event: StoredEvent | null;
  errors: ApiError[];
};

export function eventSuccessResponse(event: StoredEvent): EventResponse {
  return {
    ok: true,
    event,
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