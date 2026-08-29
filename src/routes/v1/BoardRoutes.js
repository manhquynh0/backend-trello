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
import { verifyPermission } from '~/middlewares/rabcMiddleware'
import { permission } from '~/config/rabcConfig'
import {
  multerUploadMiddleware
} from '~/middlewares/multerUpLoadMiddleware'
const Router = express.Router()
Router.route('/')
  .get(authMiddleware.isAuthorized, boardController.getBoards)
  .post(authMiddleware.isAuthorized, boardValidations.createdNew, boardController.createdNew)
Router.route('/supports/moving_cards')
  .put(authMiddleware.isAuthorized, verifyPermission([permission.MOVE_CARD]), boardValidations.movingCard, boardController.movingCard)
Router.route('/:id')
  .get(authMiddleware.isAuthorized, boardController.getDetails)
  .put(authMiddleware.isAuthorized, verifyPermission([permission.UPDATE_BOARD]), multerUploadMiddleware.upload.single('boardCover'), boardValidations.updateBoard, boardController.updateBoard)
  .delete(authMiddleware.isAuthorized, verifyPermission([permission.DELETE_BOARD]), boardController.deleteBoard)
  .patch(authMiddleware.isAuthorized, verifyPermission([permission.ARCHIVE_BOARD]), boardController.archiveBoard)

Router.route('/:id/undodelete')
  .patch(authMiddleware.isAuthorized, verifyPermission([permission.RESTORE_BOARD]), boardController.undoBoard)


export default Router