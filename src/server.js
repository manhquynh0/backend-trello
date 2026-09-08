/* eslint-disable no-console */
import createApp from './app'
import {
  corsOptions
} from '~/config/cors'
import {
  Connect_DB
} from '~/config/database'
import 'dotenv/config'
import http from 'http'
import { Server } from 'socket.io'
import { inviteUserToBoardSocket } from '~/sockets/inviteUserToBoardSocket'
import { userJoinCardSocket } from '~/sockets/userJoinCardSocket'
import { CONNECT_REDIS } from '~/config/redis'
import { draggingSocket } from '~/sockets/draggingSocket'
const START_SERVER = () => {
  const httpServer = http.createServer(createApp)
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
    console.log(`Server is running on http://${process.env.APP_HOST}:${process.env.APP_PORT}`)
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