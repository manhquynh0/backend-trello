/* eslint-disable no-useless-catch */
import Joi from 'joi'
import { ObjectId } from 'mongodb'
import {
  EMAIL_RULE,
  EMAIL_RULE_MESSAGE,
  PASSWORD_RULE,
  PASSWORD_RULE_MESSAGE
} from '~/utils/validators'
import {
  GET_DB
} from '~/config/database'
// Define Collection (name & schema)
const USER_ROLE = {
  CLIENT: 'client',
  ADMIN: 'admin'
}
const INVALID_UPDATE_FIELDS = ['_id', 'email', 'userName', 'createdAt']
const USER_COLLECTION_NAME = 'users'
const USER_COLLECTION_SCHEMA = Joi.object({
  email: Joi.string().required().pattern(EMAIL_RULE).message(EMAIL_RULE_MESSAGE),
  password: Joi.string().trim().required().pattern(PASSWORD_RULE).message(PASSWORD_RULE_MESSAGE),
  avatar: Joi.string().default(null),
  userName: Joi.string().required().trim().strict(),
  displayName: Joi.string().required().trim().strict(),
  role: Joi.string().valid(USER_ROLE.CLIENT, USER_ROLE.ADMIN).default(USER_ROLE.CLIENT),
  isActive: Joi.boolean().default(false),
  verifyToken: Joi.string(),
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)

})
const validateBeforeCreate = async (data) => {
  return await USER_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false
  })
}
const createNew = async (data) => {
  try {
    const validatedData = await validateBeforeCreate(data)
    const newAccount = {
      ...validatedData
    }
    const createdColumn = await GET_DB().collection(USER_COLLECTION_NAME).insertOne(newAccount)
    return createdColumn
  } catch (error) {
    throw error

  }
}
const findOneById = async (userId) => {
  try {
    const result = await GET_DB().collection(USER_COLLECTION_NAME).findOne({
      _id: new ObjectId(userId)
    })
    return result
  } catch (error) {
    throw error
  }
}
const findOneByEmail = async (userEmail) => {
  try {
    const result = await GET_DB().collection(USER_COLLECTION_NAME).findOne({
      email: userEmail
    })
    return result
  } catch (error) {
    throw error
  }
}
const update = async (userId, updateData) => {
  try {
    Object.keys(updateData).forEach(field => {
      if (INVALID_UPDATE_FIELDS.includes(field)) {
        delete updateData[field]
      }
    })
    const result = await GET_DB().collection(USER_COLLECTION_NAME).findOneAndUpdate({
      _id: new ObjectId(userId)
    }, {
      $set: updateData
    }, {
      returnDocument: 'after'
    })
    return result
  } catch (error) {
    throw error
  }

}
export const userModel = {
  createNew,
  findOneById,
  findOneByEmail,
  update
}