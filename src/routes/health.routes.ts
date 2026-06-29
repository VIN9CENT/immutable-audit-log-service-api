import { Router } from 'express'

const router = Router()

router.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Immutable Audit Log Service API',
  })
})

export default router