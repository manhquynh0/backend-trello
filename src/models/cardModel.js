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
// Define Collection (name & schema)
const CARD_COLLECTION_NAME = 'cards'
const CARD_COLLECTION_SCHEMA = Joi.object({
  boardId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  columnId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),

  title: Joi.string().required().min(3).max(50).trim().strict(),
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
// const getDetails = async (id) => {
//   try {
//     const result = await GET_DB().collection(card_COLLECTION_NAME).aggregate([
//       {
//         $match: {
//           _id: new ObjectId(id),
//           _destroy: false
//         }
//       },
//       {
//         $lookup: {
//           from: cardModel.CARD_COLLECTION_NAME,
//           localField: '_id',
//           foreignField: 'cardId',
//           as: 'columns' // tự động sinh ra
//         }
//       },
//       {
//         $lookup: {
//           from: cardModel.CARD_COLLECTION_NAME,
//           localField: '_id',
//           foreignField: 'cardId',
//           as: 'cards'
//         }
//       }
//     ]).toArray()
//     return result[0] || {}
//   } catch (error) {
//     throw new Error(error)

//   }
// }
export const cardModel = {
  createNew,
  findOneById,
  CARD_COLLECTION_NAME,
  CARD_COLLECTION_SCHEMA
}