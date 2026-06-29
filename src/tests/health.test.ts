import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../server'

describe('GET /health', () => {
  it('returns 200 with status OK', async () => {
    const res = await request(app).get('/health')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('OK')
    expect(res.body.timestamp).toBeDefined()
    expect(res.body.service).toBeDefined()
  })
})

