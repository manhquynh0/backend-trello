import express from 'express'
import {
  cardValidations
} from '~/validations/cardValidations'
import {
  cardController
} from '~/controllers/cardController'
const Router = express.Router()
Router.route('/')
  .post(cardValidations.createdNew, cardController.createdNew)
export default Router