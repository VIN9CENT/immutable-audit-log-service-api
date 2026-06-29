import { db } from "../db/connection";
import { events } from "../db/schema";
import type { NewEvent, Event } from "../db/schema";

export async function psqlEventRepository(event: NewEvent): Promise<Event> {
  const [saved] = await db.insert(events).values(event).returning()
  if (!saved) throw new Error('Failed to insert event')
  return saved
}

export async function getAllEvents() {
  return await db.select().from(events);
}
