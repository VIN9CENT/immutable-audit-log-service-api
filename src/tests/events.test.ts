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
})