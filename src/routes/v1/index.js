import express from 'express'
import { StatusCodes } from 'http-status-codes'
import boardRoute from './BoardRoutes'
const Router = express.Router()
Router.get('/status', (req, res) => {
  res.status(StatusCodes.OK).json({
    message: 'APIs V1 are ready to use'
  })
})
Router.use('/boards', boardRoute)
export default Router