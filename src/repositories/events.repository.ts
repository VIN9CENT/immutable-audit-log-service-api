import { db } from "../db/connection";
import { events } from "../db/schema";
import type { NewEvent, Event } from "../db/schema";
import { eq, and, gte, lte, count } from 'drizzle-orm'

export interface FilterType {
  actor_id?: string | undefined
  action?: string | undefined
  resource_type?: string | undefined
  resource_id?: string | undefined
  from?: string | undefined
  to?: string | undefined
  limit?: number | undefined
  offset?: number | undefined
}
export interface QueryResult {
  events: Event[]
  total: number
  limit: number
  offset: number
}

export const psqlEventRepository = async (event: NewEvent): Promise<Event> => {
  const [saved] = await db.insert(events).values(event).returning()
  if (!saved) throw new Error('Failed to insert event')
  return saved
}

export const psqlBulkEventRepository = async (newEvents: NewEvent[]): Promise<Event[]> => {
  return await db.transaction(async (tx) => {
    const saved = await tx.insert(events).values(newEvents).returning()
    return saved
  })
}














export const getEvents = async (filters: FilterType): Promise<QueryResult> => {
  const limit = filters.limit ?? 20  
  const offset = filters.offset ?? 0

  const conditions = [
    filters.actor_id ? eq(events.actor_id, filters.actor_id) : undefined,
    filters.action ? eq(events.action, filters.action) : undefined,
    filters.resource_type ? eq(events.resource_type, filters.resource_type) : undefined,
    filters.resource_id ? eq(events.resource_id, filters.resource_id) : undefined,
    filters.from ? gte(events.timestamp, new Date(filters.from)) : undefined,
    filters.to ? lte(events.timestamp, new Date(filters.to)) : undefined,
  ].filter(Boolean)  

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [rows, countResult] = await Promise.all([
    db.select().from(events).where(where).limit(limit).offset(offset),
    db.select({ count: count() }).from(events).where(where),
  ])

  return {
    events: rows,
    total: Number(countResult[0]!.count),
    limit,
    offset,
  }
}

export const getEventById = async (id: string): Promise<Event | null> => {
  const [event] = await db.select().from(events).where(eq(events.id, id))
  return event ?? null
}