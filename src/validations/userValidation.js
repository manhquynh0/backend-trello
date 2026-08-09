import Joi from 'joi'
import StatusCodes from 'http-status-codes'
import ApiError from '../utils/ApiError'
import {
  EMAIL_RULE,
  EMAIL_RULE_MESSAGE,
  PASSWORD_RULE,
  PASSWORD_RULE_MESSAGE
} from '~/utils/validators'
const createNew = async (req, res, next) => {
  const correctCondition = Joi.object({
    email: Joi.string().required().pattern(EMAIL_RULE).message(EMAIL_RULE_MESSAGE),
    password: Joi.string().trim().required().pattern(PASSWORD_RULE).message(PASSWORD_RULE_MESSAGE),
    avatar: Joi.string().default([]),
    isActive: Joi.boolean().default(false),
    createdAt: Joi.date().timestamp('javascript').default(Date.now),
    updatedAt: Joi.date().timestamp('javascript').default(null)


  })
  try {
    await correctCondition.validateAsync(req.body, {
      abortEarly: false
    })
    next()
  } catch (error) {
    const errorMessage = new Error(error).message
    const customError = new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage)
    next(customError)
  }
}
const verify = async (req, res, next) => {
  const correctCondition = Joi.object({
    email: Joi.string().required().pattern(EMAIL_RULE).message(EMAIL_RULE_MESSAGE),
    token: Joi.string().required()
  })
  try {
    await correctCondition.validateAsync(req.body, {
      abortEarly: false
    })
    next()
  } catch (error) {
    const errorMessage = new Error(error).message
    const customError = new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage)
    next(customError)
  }

}
const login = async (req, res, next) => {
  const correctCondition = Joi.object({
    email: Joi.string().required().pattern(EMAIL_RULE).message(EMAIL_RULE_MESSAGE),
    password: Joi.string().required().pattern(PASSWORD_RULE).message(PASSWORD_RULE_MESSAGE)
  })
  try {
    await correctCondition.validateAsync(req.body, {
      abortEarly: false
    })
    next()
  } catch (error) {
    const errorMessage = new Error(error).message
    const customError = new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage)
    next(customError)
  }

}
const update = async (req, res, next) => {
  const correctCondition = Joi.object({
    displayName: Joi.string().trim().strict(),
    password: Joi.string().pattern(PASSWORD_RULE).message(PASSWORD_RULE_MESSAGE),
    newPassword: Joi.string().pattern(PASSWORD_RULE).message(PASSWORD_RULE_MESSAGE)

  })
  try {
    await correctCondition.validateAsync(req.body, {
      abortEarly: false,
      allowUnknown : true
    })
    next()
  } catch (error) {
    const errorMessage = new Error(error).message
    const customError = new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage)
    next(customError)
  }

}
export const userValidation = {
  createNew,
  verify,
  login,
  update
}