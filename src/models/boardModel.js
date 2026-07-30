import Joi from 'joi'
import {
  GET_DB
} from '~/config/database'
const BOARD_COLLECTION_NAME = 'boards'
const BOARD_COLLECTION_SCHEMA = Joi.object({
  title: Joi.string()
    .required()
    .min(3)
    .max(50)
    .trim()
    .strict(),
  slug: Joi.string()
    .required()
    .min(3)
    .max(50)
    .trim()
    .strict(),
  description: Joi.string()
    .required()
    .min(3)
    .max(256)
    .trim()
    .strict(),
  columnOrderIds: Joi.array().items(Joi.string()).default([]),
  createdAt: Joi.date().default(Date.now),
  updatedAt: Joi.date().default(Date.now),
  _destroy: Joi.boolean().default(false)

})
const createNew = async (data) => {
  try {
    const createdBoard = await GET_DB().collection(BOARD_COLLECTION_NAME).insertOne(data)
    return createdBoard
  } catch (error) {
    throw new Error(error)

  }
}
const findOneById = async (id) => {
  try {
    const result = await GET_DB().collection(BOARD_COLLECTION_NAME).findOne({
      _id: id
    })
    return result
  } catch (error) {
    throw new Error(error)
  }
}
export const boardModel = {
  BOARD_COLLECTION_NAME,
  BOARD_COLLECTION_SCHEMA,
  createNew,
  findOneById
}