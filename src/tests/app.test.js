
import request from 'supertest'
import createApp from '~/app'
describe('createApp()', () => {
  let app
  beforeEach(() => {
    app = createApp()
  })

  it('GET /test', async () => {
    const res = await request(app).get('/test')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      message: 'TEST API'
    })
  })

  it('set no-cache headers for responses', async() => {
    const res = await request(app).get('/test')
    expect(res.headers['cache-control']).toContain('no-store')
  })

  it('GET /NotFound', async () => {
    const res = await request(app).get('/NotFound')
    expect(res.status).toBe(404)
  })
})