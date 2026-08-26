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
import { verifyPermission } from '~/middlewares/rabcMiddleware'
import { permission } from '~/config/rabcConfig'
const Router = express.Router()
Router.route('/board')
  .post(authMiddleware.isAuthorized, invitationValidations.createdNew, invitationController.createdNew)
Router.route('/')
  .get(authMiddleware.isAuthorized, invitationController.getInvitations)
Router.route('/board/:id')
  .put(authMiddleware.isAuthorized, verifyPermission([permission.INVITE_MEMBER_TO_BOARD]), invitationController.update)

export default Router