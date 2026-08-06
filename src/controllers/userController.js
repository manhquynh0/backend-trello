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
export const userController = {
  createNew
}