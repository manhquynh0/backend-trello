import {
  StatusCodes
} from 'http-status-codes'
import ApiError from '../utils/ApiError'
import bcryptjs from 'bcryptjs'
import {
  v4 as uuidv4
} from 'uuid'
import {
  userModel
} from '~/models/userModel'
import {
  pickUser
} from '~/utils/formatter'
const createNew = async (reqBody) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const exitUser = await userModel.findOneByEmail(reqBody.email)
    if (exitUser) {
      throw new ApiError(StatusCodes.CONFLICT, 'Email already exists !')
    }
    const nameFromEmail = reqBody.email.split('@')[0]
    const newUser = {
      email: reqBody.email,
      password: bcryptjs.hashSync(reqBody.password, 8),
      userName: nameFromEmail,
      displayName: nameFromEmail,
      verifyToken: uuidv4()
    }
    const createdUser = await userModel.createNew(newUser)
    const getNewUser = await userModel.findOneById(createdUser.insertedId)
    return pickUser(getNewUser)
  } catch (error) {
    throw error
  }
}
export const userService = {
  createNew
}