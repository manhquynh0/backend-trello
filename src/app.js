import express from 'express'
import cors from 'cors'
import {
  corsOptions
} from '~/config/cors'
import APIs_v1 from '~/routes/v1'
import {
  errorHandlingMiddleware
} from '~/middlewares/errorHandlingMiddleware'
import cookie from 'cookie-parser'
export const createApp = () => {
  const app = express()
  app.use(cors(corsOptions))
  app.use(cookie())
  // fix cache from disk
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })
  // cho phep gui du lieu dang json
  app.use(express.json())
  //test Api
  app.get('/test', (req, res) => {
    res.status(200).json({
      message : 'TEST API'
    })
  })
  // route v1
  app.use('/v1', APIs_v1)

  app.use(errorHandlingMiddleware)
  return app
}
export default createApp