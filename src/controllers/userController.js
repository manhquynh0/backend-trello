import {
  userService
} from '~/services/userSevice'
import StatusCodes from 'http-status-codes'
const createNew = async (req, res, next) => {
  try {
    const createAccount = await userService.createNew(req.body)
    res.status(StatusCodes.CREATED).json(createAccount)
  } catch (error) {
    next(error)
  }
}
const verify = async (req, res, next) => {
  try {
    const verifyAccount = await userService.verify(req.body)
    res.status(StatusCodes.OK).json(verifyAccount)
  } catch (error) {
    next(error)
  }
}
const login = async (req, res, next) => {
  try {
    const loginAccount = await userService.login(req.body)
    res.status(StatusCodes.OK).json(loginAccount)
  } catch (error) {
    next(error)
  }
}
export const userController = {
  createNew,
  verify,
  login
}