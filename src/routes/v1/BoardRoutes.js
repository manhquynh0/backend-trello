import express from 'express'
import StatusCodes from 'http-status-codes'
import {
  boardValidations
} from '~/validations/boardValidations'
import {
  boardController
} from '~/controllers/boardController'
const Router = express.Router()
Router.route('/')
  .get((req, res) => {
    res.status(StatusCodes.OK).json({
      message: 'NOTE : API got listboard'
    })

  })
  .post(boardValidations.createdNew, boardController.createdNew)
Router.route('/:id')
  .get(boardController.getDetails)
  .put(boardValidations.updateBoard, boardController.updateBoard)

export default Router