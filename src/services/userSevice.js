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
import {
  WEBSITE_DOMAIN
} from '~/utils/constants'
import {
  BrevoProvider
} from '~/providers/BrevoProvider'
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
    const verificationLink = `${WEBSITE_DOMAIN}/account/verification?email=${getNewUser.email}&token=${getNewUser.verifyToken}`
    const customSubject = 'ManhQuynhDev'
    const html = `
    <h1>ManhQuynhDev</h1>
    <h3>${verificationLink}</h3>`
    await BrevoProvider.sendEmail(getNewUser, customSubject, html)
    console.log(getNewUser.email)
    return pickUser(getNewUser)
  } catch (error) {
    throw error
  }
}
export const userService = {
  createNew
}