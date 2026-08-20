import express from 'express'
import {
  boardValidations
} from '~/validations/boardValidations'
import {
  boardController
} from '~/controllers/boardController'
import {
  authMiddleware
} from '~/middlewares/authMiddleware'
const Router = express.Router()
Router.route('/')
  .get(authMiddleware.isAuthorized, boardController.getBoards)
  .post(authMiddleware.isAuthorized, boardValidations.createdNew, boardController.createdNew)
Router.route('/supports/moving_cards')
  .put(authMiddleware.isAuthorized, boardValidations.movingCard, boardController.movingCard)
Router.route('/:id')
  .get(authMiddleware.isAuthorized, boardController.getDetails)
  .put(authMiddleware.isAuthorized, boardValidations.updateBoard, boardController.updateBoard)


export default Router