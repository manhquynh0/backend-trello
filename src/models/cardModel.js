import Joi from 'joi'
import {
  OBJECT_ID_RULE,
  OBJECT_ID_RULE_MESSAGE
} from '~/utils/validators'
import {
  ObjectId
} from 'mongodb'
import {
  GET_DB
} from '~/config/database'
import {
  EMAIL_RULE,
  EMAIL_RULE_MESSAGE

} from '~/utils/validators'
// Define Collection (name & schema)
const CARD_COLLECTION_NAME = 'cards'
const INVALID_UPDATE_FIELDS = ['_id', 'boardId', 'createdAt']
const CARD_COLLECTION_SCHEMA = Joi.object({
  boardId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  columnId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  title: Joi.string().required().min(3).max(50).trim().strict(),
  cover: Joi.string().default(null),
  memberIds: Joi.array().items(Joi.string()).default([]),
  comments: Joi.array().items({
    userId: Joi.string()
      .pattern(OBJECT_ID_RULE)
      .message(OBJECT_ID_RULE_MESSAGE),

    userEmail: Joi.string()
      .pattern(EMAIL_RULE)
      .message(EMAIL_RULE_MESSAGE),

    userAvatar: Joi.string(),

    userDisplayName: Joi.string(),

    content: Joi.string(),

    // Chỗ này lưu ý vì dùng hàm $push để thêm comment
    // nên không set default Date.now luôn giống hàm insertOne khi create được.
    commentedAt: Joi.date().timestamp()
  }).default([]),
  description: Joi.string().optional(),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})
const validateBeforeCreate = async (data) => {
  return await CARD_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false
  })
}
const createNew = async (data) => {
  try {
    const validatedData = await validateBeforeCreate(data)
    const newAddCard = {
      ...validatedData,
      columnId: new ObjectId(validatedData.columnId),
      boardId: new ObjectId(validatedData.boardId)
    }
    const createdcard = await GET_DB().collection(CARD_COLLECTION_NAME).insertOne(newAddCard)
    return createdcard
  } catch (error) {
    throw new Error(error)

  }
}
const findOneById = async (id) => {
  try {
    const result = await GET_DB().collection(CARD_COLLECTION_NAME).findOne({
      _id: new ObjectId(id)
    })
    return result
  } catch (error) {
    throw new Error(error)
  }
}
const updatedCard = async (cardId, updateData) => {
  try {
    Object.keys(updateData).forEach(fieldName => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName)) {
        delete updateData[fieldName]
      }
    })
    const result = await GET_DB().collection(CARD_COLLECTION_NAME).findOneAndUpdate({
      _id: new ObjectId(cardId)
    }, {
      $set: updateData

    }, {
      returnDocument: 'after'
    })
    return result || null
  } catch (error) {
    throw new Error(error)
  }
}

export const cardModel = {
  createNew,
  findOneById,
  CARD_COLLECTION_NAME,
  CARD_COLLECTION_SCHEMA,
  updatedCard
}