import Joi from 'joi'
import StatusCodes from 'http-status-codes'
import ApiError from '../utils/ApiError'

const createNew = async (req, res, next) => {
  const labelItemSchema = Joi.object({
    name: Joi.string().required().min(3).max(50).trim().strict(),
    color: Joi.string().required(),
    isActive: Joi.boolean().default(false)
  })

  const correctCondition = Joi.alternatives().try(
    labelItemSchema,
    Joi.object({
      labels: Joi.array().items(labelItemSchema).min(1).required()
    })
  )

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

const updateLabel = async (req, res, next) => {
  const correctCondition = Joi.object({
    name: Joi.string().min(3).max(50).trim().strict(),
    color: Joi.string(),
    isActive: Joi.boolean()
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

export const labelValidations = {
  createNew,
  updateLabel
}