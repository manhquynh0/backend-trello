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
Router.route('/board/:id')
  .put(authMiddleware.isAuthorized, invitationController.update)

export default Router