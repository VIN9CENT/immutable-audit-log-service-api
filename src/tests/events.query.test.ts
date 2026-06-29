import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../server'

describe('GET /events', () => {
  it('returns 200 with list of events', async () => {
    const res = await request(app).get('/events')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(Array.isArray(res.body.events)).toBe(true)
    expect(res.body.total).toBeDefined()
    expect(res.body.limit).toBeDefined()
    expect(res.body.offset).toBeDefined()
  })

  it('filters by actor_id', async () => {
    const res = await request(app).get('/events?actor_id=user-123')
    expect(res.status).toBe(200)
    res.body.events.forEach((e: any) => {
      expect(e.actor_id).toBe('user-123')
    })
  })

  it('returns 200 with empty events array when no events match filter', async () => {
    const res = await request(app).get('/events?actor_id=nonexistent-user')
    expect(res.status).toBe(200)
    expect(res.body.events).toEqual([])
    expect(res.body.total).toBe(0)
  })

  it('returns default limit of 20 when no limit is supplied', async () => {
    const res = await request(app).get('/events')
    expect(res.status).toBe(200)
    expect(res.body.limit).toBe(20)
  })

  it('filters correctly by action', async () => {
    const res = await request(app).get('/events?action=CREATE')
    expect(res.status).toBe(200)
    res.body.events.forEach((e: any) => {
      expect(e.action).toBe('CREATE')
    })
  })

  it('combines multiple filters correctly', async () => {
    const res = await request(app).get('/events?actor_id=user-123&action=CREATE')
    expect(res.status).toBe(200)
    res.body.events.forEach((e: any) => {
      expect(e.actor_id).toBe('user-123')
      expect(e.action).toBe('CREATE')
    })
  })

  it('returns correct pagination metadata', async () => {
    const res = await request(app).get('/events?limit=5&offset=0')
    expect(res.status).toBe(200)
    expect(res.body.limit).toBe(5)
    expect(res.body.offset).toBe(0)
    expect(res.body.total).toBeDefined()
  })
})

describe('GET /events/:id', () => {
  it('returns 404 for non-existent event', async () => {
    const res = await request(app).get('/events/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
    expect(res.body.ok).toBe(false)
  })

  it('returns correct event fields', async () => {
    const created = await request(app).post('/events').send({
      actor_id: 'user-123',
      action: 'CREATE',
      resource_type: 'document',
      resource_id: 'doc-1',
    })
    const id = created.body.event.id
    const res = await request(app).get(`/events/${id}`)
    expect(res.status).toBe(200)
    expect(res.body.event.id).toBe(id)
    expect(res.body.event.actor_id).toBe('user-123')
  })

  it('does not return signature field', async () => {
    const created = await request(app).post('/events').send({
      actor_id: 'user-123',
      action: 'CREATE',
      resource_type: 'document',
      resource_id: 'doc-1',
    })
    const id = created.body.event.id
    const res = await request(app).get(`/events/${id}`)
    expect(res.body.event.signature).toBeUndefined()
  })

  it('returns 200 with valid event data', async () => {
    const created = await request(app).post('/events').send({
      actor_id: 'user-123',
      action: 'UPDATE',
      resource_type: 'product',
      resource_id: 'product-1',
      before_state: { price: 10 },
      after_state: { price: 20 },
    })
    const id = created.body.event.id
    const res = await request(app).get(`/events/${id}`)
    expect(res.status).toBe(200)
    expect(res.body.event.before_state).toEqual({ price: 10 })
    expect(res.body.event.after_state).toEqual({ price: 20 })
  })
})

describe('Pagination', () => {
  it('returns empty list when offset is beyond total records', async () => {
    const res = await request(app).get('/events?offset=99999')
    expect(res.status).toBe(200)
    expect(res.body.events).toEqual([])
  })

  it('returns correct number of events with limit', async () => {
    const res = await request(app).get('/events?limit=2')
    expect(res.status).toBe(200)
    expect(res.body.events.length).toBeLessThanOrEqual(2)
  })

  it('returns different events on different pages', async () => {
    const page1 = await request(app).get('/events?limit=1&offset=0')
    const page2 = await request(app).get('/events?limit=1&offset=1')
    expect(page1.body.events[0]?.id).not.toBe(page2.body.events[0]?.id)
  })

  it('total is consistent across pages', async () => {
    const page1 = await request(app).get('/events?limit=1&offset=0')
    const page2 = await request(app).get('/events?limit=1&offset=1')
    expect(page1.body.total).toBe(page2.body.total)
  })

  it('offset 0 and no offset return same results', async () => {
    const withOffset = await request(app).get('/events?limit=5&offset=0')
    const withoutOffset = await request(app).get('/events?limit=5')
    expect(withOffset.body.events).toEqual(withoutOffset.body.events)
  })
})