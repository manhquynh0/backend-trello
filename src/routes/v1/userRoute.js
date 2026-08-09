import express from 'express'
import {
  userValidation
} from '~/validations/userValidation'
import {
  userController
} from '~/controllers/userController'
const Router = express.Router()
import {
  authMiddleware
} from '~/middlewares/authMiddleware'
Router.route('/register')
  .post(userValidation.createNew, userController.createNew)
Router.route('/verify')
  .put(userValidation.verify, userController.verify)
Router.route('/login')
  .post(userValidation.login, userController.login)
Router.route('/refresh_token')
  .post(userController.refreshToken)
Router.route('/logout')
  .delete(userController.logout)
Router.route('/update')
  .put(authMiddleware.isAuthorized, userValidation.update, userController.update)
export default Router