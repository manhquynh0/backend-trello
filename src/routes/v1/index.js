import express from 'express'
import { StatusCodes } from 'http-status-codes'
import boardRoute from './BoardRoutes'
import cardRoute from './cardRoute'
import columnRoute from './columnRoute'
import userRoute from './userRoute'
const Router = express.Router()
Router.get('/status', (req, res) => {
  res.status(StatusCodes.OK).json({
    message: 'APIs V1 are ready to use'
  })
})
Router.use('/boards', boardRoute)
Router.use('/cards', cardRoute)
Router.use('/columns', columnRoute)
Router.use('/users', userRoute)
export default Router