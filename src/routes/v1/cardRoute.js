import express from 'express'
import {
  cardValidations
} from '~/validations/cardValidations'
import {
  cardController
} from '~/controllers/cardController'
import {
  authMiddleware
} from '~/middlewares/authMiddleware'
import {
  multerUploadMiddleware
} from '~/middlewares/multerUpLoadMiddleware'
import { verifyPermission } from '~/middlewares/rabcMiddleware'
import { permission } from '~/config/rabcConfig'
const Router = express.Router()
Router.route('/')
  .post(authMiddleware.isAuthorized, cardValidations.createdNew, cardController.createdNew)
Router.route('/:id')
  .get(authMiddleware.isAuthorized, cardController.getDetails)
  .put(authMiddleware.isAuthorized,
    verifyPermission([permission.UPDATE_CARD]),
    multerUploadMiddleware.upload.fields([{ name: 'cardCover', maxCount: 1 }, { name: 'attachments', maxCount: 10 }]),
    cardValidations.updated,
    cardController.updated)
  .patch(authMiddleware.isAuthorized, cardController.archivedCard)
Router.route('/:id/attachments')
  .post(authMiddleware.isAuthorized, cardValidations.createdAttachment, cardController.createdAttachment)
Router.route('/:cardId/attachments/:publicId(*)')
  .delete(authMiddleware.isAuthorized, cardController.deleteAttachment)
export default Router