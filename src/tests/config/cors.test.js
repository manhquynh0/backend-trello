import {
  corsOptions
} from '~/config/cors'
import request from 'supertest'
import express from 'express'
import cors from 'cors'
import {
  errorHandlingMiddleware
} from '~/middlewares/errorHandlingMiddleware'
describe('corsMiddlware', () => {
  const createTestApp = () => {
    const app = express()
    app.use(cors(corsOptions))
    app.get('/test', (req, res) => res.status(200).json({
      message: 'OK'
    }))
    app.use(errorHandlingMiddleware)
    return app
  }
  it('Allow request when origin is in whitelist', async () => {
    const orgin = 'http://localhost:5173'
    const app = createTestApp()
    const res = await request(app).get('/test').set('Origin', orgin)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      message: 'OK'
    })
  })
  it('Forbid request when origin is not in whitelist', async () => {
    const orgin = 'http://abcxyz'
    const app = createTestApp()
    const res = await request(app).get('/test').set('Origin', orgin)

    expect(res.body).toMatchObject({
      statusCode: 403,
      message: 'http://abcxyz not allowed by our CORS Policy.'
    })
  })

  it('Allow request whitout origin', async () => {
    const app = createTestApp()
    const res = await request(app).get('/test')

    expect(res.status).toBe(200)
  })
})