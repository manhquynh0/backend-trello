/* eslint-disable no-useless-catch */
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
import {
  JwtProvider
} from '~/providers/JwtProvider'
require('dotenv').config()
const createNew = async (reqBody) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const exitUser = await userModel.findOneByEmail(reqBody.email)
    if (exitUser) {
      throw new ApiError(StatusCodes.CONFLICT, 'Email đã tồn tại !')
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
    Hello ${getNewUser.userName},

Thank you for creating your QLLO account.

Please click the button below to verify your email address.

This link will expire in 30 minutes.

Best regards,
ManhQuynhDev 
    <h3>${verificationLink}</h3>`
    await BrevoProvider.sendEmail(getNewUser, customSubject, html)
    return pickUser(getNewUser)
  } catch (error) {
    throw error
  }
}
const verify = async (reqBody) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const exitUser = await userModel.findOneByEmail(reqBody.email)
    if (!exitUser) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy tài khoản!')
    }
    if (exitUser.isActive) {
      throw new ApiError(StatusCodes.NOT_ACCEPTED, 'Tài khoản đã được kích hoạt !')
    }
    if (exitUser.verifyToken !== reqBody.token) {
      throw new ApiError(StatusCodes.NOT_ACCEPTED, 'Token không hợp lệ!')
    }
    const updateData = {
      isActive: true,
      verifyToken: null
    }
    const updateUser = await userModel.update(exitUser._id, updateData)
    return pickUser(updateUser)
  } catch (error) {
    throw error
  }
}
const login = async (reqBody) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const exitUser = await userModel.findOneByEmail(reqBody.email)
    if (!exitUser) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy tài khoản!')
    }
    if (!exitUser.isActive) {
      throw new ApiError(StatusCodes.NOT_ACCEPTED, 'Tài khoản chưa được kích hoạt')
    }
    if (!(await bcryptjs.compare(reqBody.password, exitUser.password))) {
      throw new ApiError(
        StatusCodes.NOT_ACCEPTABLE,
        'Email hoặc mật khẩu không đúng!'
      )
    }
    const userInfor = {
      email: exitUser.email,
      _id: exitUser._id
    }
    const accessToken = await JwtProvider.generateToken(userInfor, process.env.ACCESS_SECRET_SIGNATURE, process.env.ACCESS_TOKEN_LIFE)
    const refreshToken = await JwtProvider.generateToken(userInfor, process.env.REFRESH_SECRET_SIGNATURE, process.env.REFRESH_TOKEN_LIFE)

    return {
      accessToken,
      refreshToken,
      ...pickUser(exitUser)
    }

  } catch (error) {
    throw error
  }
}
const refreshToken = async (user) => {
  try {
    const refreshTokenDecode = JwtProvider.verifyToken(user, process.env.REFRESH_SECRET_SIGNATURE)
    const userInfor = {
      email: refreshTokenDecode.email,
      _id: refreshTokenDecode._id
    }
    const accessToken = await JwtProvider.generateToken(userInfor, process.env.ACCESS_SECRET_SIGNATURE, process.env.ACCESS_TOKEN_LIFE)
    return { accessToken }
  } catch (error) {
    throw error
  }
}

export const userService = {
  createNew,
  verify,
  login,
  refreshToken
}