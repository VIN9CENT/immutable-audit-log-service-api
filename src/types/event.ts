import type { CreateEventInput } from "../validators/event.validator";

export type StoredEvent = CreateEventInput & {
  id: string;
  timestamp: string;
};