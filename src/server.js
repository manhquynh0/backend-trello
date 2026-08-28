/* eslint-disable no-console */
import express from 'express'
import cors from 'cors'
import {
  corsOptions
} from '~/config/cors'
import {
  Connect_DB
} from '~/config/database'
import APIs_v1 from '~/routes/v1'
import {
  errorHandlingMiddleware
} from '~/middlewares/errorHandlingMiddleware'
import cookie from 'cookie-parser'
import http from 'http'
import { Server } from 'socket.io'
import { inviteUserToBoardSocket } from '~/sockets/inviteUserToBoardSocket'
import { userJoinCardSocket } from '~/sockets/userJoinCardSocket'
import { CONNECT_REDIS } from '~/config/redis'
import { draggingSocket } from '~/sockets/draggingSocket'
const START_SERVER = () => {
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
  // route v1
  app.use('/v1', APIs_v1)

  app.use(errorHandlingMiddleware)

  const httpServer = http.createServer(app)
  const io = new Server(httpServer, {
    cors: corsOptions
  })
  io.on('connection', (socket) => {
    console.log('New user connected:', socket.id)
    inviteUserToBoardSocket(socket)
    userJoinCardSocket(socket)
    draggingSocket(socket)
  })

  httpServer.listen(3000, () => {
    console.log('Server is running on http://localhost:3000')
  })
}

Connect_DB()
  .then(() => console.log('Connected to MongoDb Cloud Atlas !'))
  .then(() => CONNECT_REDIS())
  .then(() => START_SERVER())
  .catch((error) => {
    console.log(error)
    process.exit(0)
  })