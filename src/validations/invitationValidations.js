import Joi from 'joi'
import StatusCodes from 'http-status-codes'
import ApiError from '../utils/ApiError'
import {
  EMAIL_RULE,
  EMAIL_RULE_MESSAGE
} from '~/utils/validators'
const createdNew = async (req, res, next) => {
  const correctCondition = Joi.object({
    inviteeEmail: Joi.string().required().pattern(EMAIL_RULE).message(EMAIL_RULE_MESSAGE),
    boardId: Joi.string().required()
  })
  try {
    await correctCondition.validateAsync(req.body, {
      abortEarly: false
    })
    next()
    // res.status(StatusCodes.CREATED).json({
    //   message: 'POST from Validation : API create new board'
    // })
  } catch (error) {
    const errorMessage = new Error(error).message
    const customError = new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage)
    next(customError)
  }
}

export const invitationValidations = {
  createdNew

}