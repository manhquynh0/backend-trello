/* eslint-disable no-console */
import express from 'express'
import {
  Connect_DB,
  GET_DB
} from '~/config/database'
const START_SERVER = () => {
  const app = express()

  app.get('/', async (req, res) => {
    console.log(await GET_DB().listCollections().toArray())
    res.send('Hello World')
  })

  app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000')
  })
}
Connect_DB()
  .then(() => console.log('Connected to MongoDb Cloud Alats !'))
  .then(() => START_SERVER())
  .catch((error) => {
    console.log(error)
    process.exit(0)
  })