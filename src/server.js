/* eslint-disable no-console */
import express from 'express'
import {
  Connect_DB,
  GET_DB
} from '~/config/database'
import APIs_v1 from '~/routes/v1'
import { errorHandlingMiddleware } from '~/middlewares/errorHandlingMiddleware'
const START_SERVER = () => {
  const app = express()
  // cho phep gui du lieu dang json
  app.use(express.json())
  // route v1
  app.use('/v1', APIs_v1)

  app.use(errorHandlingMiddleware)

  app.get('/', async (req, res) => {
    console.log(await GET_DB().listCollections().toArray())
    res.send('Hello World')
  })

  app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000')
  })
}

Connect_DB()
  .then(() => console.log('Connected to MongoDb Cloud Atlas !'))
  .then(() => START_SERVER())
  .catch((error) => {
    console.log(error)
    process.exit(0)
  })