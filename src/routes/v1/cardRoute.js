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
const Router = express.Router()
Router.route('/')
  .post(authMiddleware.isAuthorized, cardValidations.createdNew, cardController.createdNew)
Router.route('/:id')
  .get(authMiddleware.isAuthorized, cardController.getDetails)
  .put(authMiddleware.isAuthorized,
    multerUploadMiddleware.upload.single('cardCover'),
    cardValidations.updated,
    cardController.updated)
export default Router