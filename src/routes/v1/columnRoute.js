import express from 'express'
import {
  columnValidations
} from '~/validations/columnValidations'
import {
  columnController
} from '~/controllers/columnController'
const Router = express.Router()
Router.route('/')
  .post(columnValidations.createdNew, columnController.createdNew)
Router.route('/:id')
  .put(columnValidations.updatedColumn, columnController.updatedColumn)
  .patch(columnController.deletedColumn)


export default Router