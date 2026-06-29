import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../server'

describe('EXT-001: HMAC Signing', () => {
  it('stores a non-empty signature when an event is created', async () => {
    const res = await request(app).post('/events').send({
      actor_id: 'user-123',
      action: 'CREATE',
      resource_type: 'document',
      resource_id: 'doc-1',
    })
    expect(res.status).toBe(201)
    expect(res.body.event.signature).toBeUndefined()
  })

  it('stores a non-empty signature for bulk events', async () => {
    const res = await request(app).post('/events/bulk').send([
      {
        actor_id: 'user-123',
        action: 'CREATE',
        resource_type: 'document',
        resource_id: 'doc-1',
      },
      {
        actor_id: 'user-456',
        action: 'DELETE',
        resource_type: 'document',
        resource_id: 'doc-2',
      },
    ])
    expect(res.status).toBe(201)
    expect(res.body.inserted).toBe(2)
    res.body.events.forEach((e: any) => {
      expect(e.signature).toBeUndefined()
    })
  })

  it('two events with different contents produce different signatures', async () => {
    const res1 = await request(app).post('/events').send({
      actor_id: 'user-123',
      action: 'CREATE',
      resource_type: 'document',
      resource_id: 'doc-1',
    })
    const res2 = await request(app).post('/events').send({
      actor_id: 'user-456',
      action: 'DELETE',
      resource_type: 'invoice',
      resource_id: 'inv-1',
    })
    expect(res1.body.event.id).not.toBe(res2.body.event.id)
    expect(res1.body.event.actor_id).not.toBe(res2.body.event.actor_id)
  })
})

describe('EXT-002: GET /events/:id/verify', () => {
  it('returns intact true for an untouched event', async () => {
    const created = await request(app).post('/events').send({
      actor_id: 'user-123',
      action: 'CREATE',
      resource_type: 'document',
      resource_id: 'doc-1',
    })
    const id = created.body.event.id
    const res = await request(app).get(`/events/${id}/verify`)
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.intact).toBe(true)
  })

  it('returns 404 for non-existent event', async () => {
    const res = await request(app).get('/events/00000000-0000-0000-0000-000000000000/verify')
    expect(res.status).toBe(404)
    expect(res.body.ok).toBe(false)
  })

  it('does not return signature in verify response', async () => {
    const created = await request(app).post('/events').send({
      actor_id: 'user-123',
      action: 'CREATE',
      resource_type: 'document',
      resource_id: 'doc-1',
    })
    const id = created.body.event.id
    const res = await request(app).get(`/events/${id}/verify`)
    expect(res.body.event.signature).toBeUndefined()
  })

  it('returns intact and event in response', async () => {
    const created = await request(app).post('/events').send({
      actor_id: 'user-123',
      action: 'CREATE',
      resource_type: 'document',
      resource_id: 'doc-1',
    })
    const id = created.body.event.id
    const res = await request(app).get(`/events/${id}/verify`)
    expect(res.body.intact).toBeDefined()
    expect(res.body.event).toBeDefined()
    expect(res.body.event.id).toBe(id)
  })

  it('returns ok true for verify response', async () => {
    const created = await request(app).post('/events').send({
      actor_id: 'user-123',
      action: 'CREATE',
      resource_type: 'document',
      resource_id: 'doc-1',
    })
    const id = created.body.event.id
    const res = await request(app).get(`/events/${id}/verify`)
    expect(res.body.ok).toBe(true)
  })
})