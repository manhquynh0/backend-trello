import Joi from 'joi'
import { GET_DB } from '~/config/database'
import { ObjectId } from 'mongodb'
import {
  OBJECT_ID_RULE,
  OBJECT_ID_RULE_MESSAGE
} from '~/utils/validators'
import { DEFAULT_LABELS } from '~/utils/constants'

const LABEL_COLLECTION_NAME = 'labels'
const INVALID_UPDATE_FIELDS = ['_id', 'cardId', 'createdAt']

const LABEL_COLLECTION_SCHEMA = Joi.object({
  cardId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  name: Joi.string().required().min(3).max(50).trim().strict(),
  color: Joi.string().required(),
  isActive: Joi.boolean().default(false),
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const validateBeforeCreate = async (data) => {
  return await LABEL_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (cardIdOrData, labelData) => {
  try {
    let rawData = {}
    if (labelData !== undefined) {
      rawData = {
        ...labelData,
        cardId: cardIdOrData?.toString()
      }
    } else {
      rawData = { ...cardIdOrData }
    }
    const validatedData = await validateBeforeCreate(rawData)
    const insertData = {
      ...validatedData,
      cardId: new ObjectId(validatedData.cardId)
    }
    const result = await GET_DB().collection(LABEL_COLLECTION_NAME).insertOne(insertData)
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async (id) => {
  try {
    const result = await GET_DB().collection(LABEL_COLLECTION_NAME).findOne({
      _id: new ObjectId(id)
    })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const updateLabel = async (cardId, labelId, data) => {
  try {
    const updateData = { ...data }
    INVALID_UPDATE_FIELDS.forEach(field => {
      delete updateData[field]
    })
    updateData.updatedAt = Date.now()

    const filter = {
      _id: new ObjectId(labelId)
    }
    if (cardId) {
      filter.cardId = new ObjectId(cardId)
    }

    const result = await GET_DB().collection(LABEL_COLLECTION_NAME).findOneAndUpdate(
      filter,
      { $set: updateData },
      { returnDocument: 'after' }
    )
    return result || null
  } catch (error) {
    throw new Error(error)
  }
}

const getLabels = async (cardId, filterStage) => {
  try {
    const filterName = filterStage?.name || filterStage?.['q[name]'] || filterStage?.q?.name
    const query = {
      cardId: new ObjectId(cardId),
      _destroy: false
    }

    if (filterName) {
      query.name = { $regex: new RegExp(filterName, 'i') }
    }

    const labels = await GET_DB()
      .collection(LABEL_COLLECTION_NAME)
      .find(query)
      .toArray()

    return { labels: labels || [] }
  } catch (error) {
    throw new Error(error)
  }
}

const deleteLabel = async (cardId, labelId) => {
  try {
    const filter = {
      _id: new ObjectId(labelId)
    }
    if (cardId) {
      filter.cardId = new ObjectId(cardId)
    }

    const result = await GET_DB().collection(LABEL_COLLECTION_NAME).findOneAndUpdate(
      filter,
      {
        $set: {
          _destroy: true,
          updatedAt: Date.now()
        }
      },
      { returnDocument: 'after' }
    )
    return result || null
  } catch (error) {
    throw new Error(error)
  }
}

const createDefaultLabels = async (cardId) => {
  try {
    const defaultData = DEFAULT_LABELS.map(label => ({
      cardId: new ObjectId(cardId),
      name: label.name,
      color: label.color,
      isActive: false,
      createdAt: Date.now(),
      updatedAt: null,
      _destroy: false
    }))
    const result = await GET_DB().collection(LABEL_COLLECTION_NAME).insertMany(defaultData)
    return result
  } catch (error) {
    throw new Error(error)
  }
}

export const labelModel = {
  LABEL_COLLECTION_NAME,
  LABEL_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  updateLabel,
  getLabels,
  deleteLabel,
  createDefaultLabels
}