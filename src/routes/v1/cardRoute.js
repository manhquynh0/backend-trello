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
Router.route('/:id/labels')
  .get(authMiddleware.isAuthorized, cardController.getLabels)
  .post(authMiddleware.isAuthorized, cardValidations.createdLabel, cardController.createdLabel)
// .delete(authMiddleware.isAuthorized, cardController.deletedLabel)
Router.route('/:id/labels/:labelId')
  .put(authMiddleware.isAuthorized, cardValidations.updateLabel, cardController.updateLabel)
Router.route('/:id/checklist')
  .post(authMiddleware.isAuthorized, cardValidations.createdChecklist, cardController.createdChecklist)
Router.route('/:id/checklist/:checklistId')
  .post(authMiddleware.isAuthorized, cardValidations.createdChecklistItem, cardController.createdChecklistItem)


export default Router