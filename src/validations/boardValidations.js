import Joi from 'joi'
import StatusCodes from 'http-status-codes'
import ApiError from '../utils/ApiError'
import {
  BOARD_TYPES
} from '~/utils/constants'
import {
  OBJECT_ID_RULE,
  OBJECT_ID_RULE_MESSAGE
} from '~/utils/validators'
const createdNew = async (req, res, next) => {
  const correctCondition = Joi.object({
    title: Joi.string()
      .required()
      .min(3)
      .max(50)
      .trim()
      .strict()
      .messages({
        'string.base': 'Tiêu đề phải là chuỗi.',
        'string.empty': 'Tiêu đề không được để trống.',
        'string.min': 'Tiêu đề phải có ít nhất 3 ký tự.',
        'string.max': 'Tiêu đề không được vượt quá 50 ký tự.',
        'any.required': 'Tiêu đề là bắt buộc.'
      }),

    description: Joi.string()
      .required()
      .min(3)
      .max(256)
      .trim()
      .strict()
      .messages({
        'string.base': 'Mô tả phải là chuỗi.',
        'string.empty': 'Mô tả không được để trống.',
        'string.min': 'Mô tả phải có ít nhất 3 ký tự.',
        'string.max': 'Mô tả không được vượt quá 256 ký tự.',
        'any.required': 'Mô tả là bắt buộc.'
      }),
    type: Joi.string().valid(BOARD_TYPES.PUBLIC, BOARD_TYPES.PRIVATE).required()
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
const updateBoard = async (req, res, next) => {
  const correctCondition = Joi.object({
    title: Joi.string()
      .min(3)
      .max(50)
      .trim()
      .strict()
      .messages({
        'string.base': 'Tiêu đề phải là chuỗi.',
        'string.empty': 'Tiêu đề không được để trống.',
        'string.min': 'Tiêu đề phải có ít nhất 3 ký tự.',
        'string.max': 'Tiêu đề không được vượt quá 50 ký tự.',
        'any.required': 'Tiêu đề là bắt buộc.'
      }),

    description: Joi.string()
      .min(3)
      .max(256)
      .trim()
      .strict()
      .messages({
        'string.base': 'Mô tả phải là chuỗi.',
        'string.empty': 'Mô tả không được để trống.',
        'string.min': 'Mô tả phải có ít nhất 3 ký tự.',
        'string.max': 'Mô tả không được vượt quá 256 ký tự.',
        'any.required': 'Mô tả là bắt buộc.'
      }),
    type: Joi.string().valid(BOARD_TYPES.PUBLIC, BOARD_TYPES.PRIVATE)
  })
  try {
    await correctCondition.validateAsync(req.body, {
      abortEarly: false,
      allowUnknown: true
    })
    next()

  } catch (error) {
    const errorMessage = new Error(error).message
    const customError = new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage)
    next(customError)
  }
}
const movingCard = async (req, res, next) => {
  const correctCondition = Joi.object({
    prevColumnId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
    nextColumnId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
    currentCardId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
    prevCardOrderIds: Joi.array().items(
      Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
    ).default([]),
    nextCardOrderIds: Joi.array().items(
      Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
    ).default([])
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
export const boardValidations = {
  createdNew,
  updateBoard,
  movingCard
}