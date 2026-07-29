import express from 'express'
import StatusCodes from 'http-status-codes'
import { boardValidations } from '~/validations/boardValidations'
const Router = express.Router()
Router.route('/')
  .get((req, res) => {
    res.status(StatusCodes.OK).json({
      message: 'NOTE : API got listboard'
    })

  })
  .post(boardValidations.createdNew)

export default Router