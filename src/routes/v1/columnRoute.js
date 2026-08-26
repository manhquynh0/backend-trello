import express from 'express'
import {
  columnValidations
} from '~/validations/columnValidations'
import {
  columnController
} from '~/controllers/columnController'
import {
  authMiddleware
} from '~/middlewares/authMiddleware'
import { verifyPermission } from '~/middlewares/rabcMiddleware'
import { permission } from '~/config/rabcConfig'
const Router = express.Router()
Router.route('/')
  .post(authMiddleware.isAuthorized, verifyPermission([permission.CREATE_COLUMN]), columnValidations.createdNew, columnController.createdNew)
Router.route('/:id')
  .put(authMiddleware.isAuthorized, verifyPermission([permission.UPDATE_COLUMN]), columnValidations.updatedColumn, columnController.updatedColumn)
  .patch(authMiddleware.isAuthorized, verifyPermission([permission.DELETE_COLUMN]), columnController.deletedColumn)


export default Router