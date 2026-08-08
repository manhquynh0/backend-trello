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
const Router = express.Router()
Router.route('/')
  .post(authMiddleware.isAuthorized, columnValidations.createdNew, columnController.createdNew)
Router.route('/:id')
  .put(authMiddleware.isAuthorized, columnValidations.updatedColumn, columnController.updatedColumn)
  .patch(authMiddleware.isAuthorized, columnController.deletedColumn)


export default Router