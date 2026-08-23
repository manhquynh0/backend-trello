import express from 'express'
import {
  invitationValidations
} from '~/validations/invitationValidations'
import {
  invitationController
} from '~/controllers/invitationController'
import {
  authMiddleware
} from '~/middlewares/authMiddleware'
const Router = express.Router()
Router.route('/board')
  .post(authMiddleware.isAuthorized, invitationValidations.createdNew, invitationController.createdNew)
Router.route('/')
  .get(authMiddleware.isAuthorized, invitationController.getInvitations)


export default Router