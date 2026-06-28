import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../server'

describe('POST /events', () => {
  it('returns 201 with valid data', async () => {
    const res = await request(app).post('/events').send({
      actor_id: 'user-123',
      action: 'CREATE',
      resource_type: 'document',
      resource_id: 'doc-456',
      before_state: null,
      after_state: { title: 'My Doc' },
    })
    expect(res.status).toBe(201)
    expect(res.body.ok).toBe(true)
    expect(res.body.event).toBeDefined()
    expect(res.body.event.signature).toBeUndefined()
  })

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/events').send({
      action: 'CREATE',
    })
    expect(res.status).toBe(400)
    expect(res.body.ok).toBe(false)
    expect(res.body.errors.length).toBeGreaterThan(0)
  })

  it('returns 400 when required fields are empty', async () => {
    const res = await request(app).post('/events').send({
      actor_id: '',
      action: 'CREATE',
      resource_type: 'document',
      resource_id: 'doc-456',
    })
    expect(res.status).toBe(400)
    expect(res.body.ok).toBe(false)
  })

  it('returns 201 when before_state and after_state are omitted', async () => {
    const res = await request(app).post('/events').send({
      actor_id: 'user-123',
      action: 'CREATE',
      resource_type: 'document',
      resource_id: 'doc-1',
    })
    expect(res.status).toBe(201)
    expect(res.body.event.before_state).toBeNull()
    expect(res.body.event.after_state).toBeNull()
  })

  it('returns 201 when before_state is null and after_state is an object', async () => {
    const res = await request(app).post('/events').send({
      actor_id: 'user-123',
      action: 'CREATE',
      resource_type: 'document',
      resource_id: 'doc-1',
      before_state: null,
      after_state: { title: 'New Doc' },
    })
    expect(res.status).toBe(201)
    expect(res.body.event.before_state).toBeNull()
    expect(res.body.event.after_state).toEqual({ title: 'New Doc' })
  })

  it('returns 400 when actor_id is a number instead of string', async () => {
    const res = await request(app).post('/events').send({
      actor_id: 123,
      action: 'CREATE',
      resource_type: 'document',
      resource_id: 'doc-1',
    })
    expect(res.status).toBe(400)
    expect(res.body.errors[0].code).toBe('INVALID_TYPE')
  })

  it('returns 201 and ignores unknown fields', async () => {
    const res = await request(app).post('/events').send({
      actor_id: 'user-123',
      action: 'CREATE',
      resource_type: 'document',
      resource_id: 'doc-1',
      unknown_field: 'should be ignored',
    })
    expect(res.status).toBe(201)
    expect(res.body.event).not.toHaveProperty('unknown_field')
  })

  it('returns 201 with server-generated id and timestamp', async () => {
    const res = await request(app).post('/events').send({
      actor_id: 'user-123',
      action: 'CREATE',
      resource_type: 'document',
      resource_id: 'doc-1',
    })
    expect(res.status).toBe(201)
    expect(res.body.event.id).toBeDefined()
    expect(res.body.event.timestamp).toBeDefined()
  })

  it('returns 400 when body is not JSON', async () => {
    const res = await request(app)
      .post('/events')
      .set('Content-Type', 'application/json')
      .send('not json')
    expect(res.status).toBe(400)
  })
})

describe('Write-only enforcement', () => {
  it('returns 405 for DELETE /events', async () => {
    const res = await request(app).delete('/events')
    expect(res.status).toBe(405)
  })

  it('returns 405 for PUT /events', async () => {
    const res = await request(app).put('/events')
    expect(res.status).toBe(405)
  })

  it('returns 405 for PATCH /events', async () => {
    const res = await request(app).patch('/events')
    expect(res.status).toBe(405)
  })

  it('returns 405 for DELETE /events/:id', async () => {
    const res = await request(app).delete('/events/some-id')
    expect(res.status).toBe(405)
  })

  it('returns 405 for PUT /events/:id', async () => {
    const res = await request(app).put('/events/some-id')
    expect(res.status).toBe(405)
  })

  it('returns 405 for PATCH /events/:id', async () => {
    const res = await request(app).patch('/events/some-id')
    expect(res.status).toBe(405)
  })
})