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
import { userModel } from './userModel'
// Define Collection (name & schema)
const CARD_COLLECTION_NAME = 'cards'
const INVALID_UPDATE_FIELDS = ['_id', 'boardId', 'createdAt']
const CARD_COLLECTION_SCHEMA = Joi.object({
  boardId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  columnId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  title: Joi.string().required().min(3).max(50).trim().strict(),
  cover: Joi.string().default(null),
  memberIds: Joi.array().items(Joi.string()).default([]),
  attachments: Joi.array().items({
    publicId: Joi.string().optional(),
    url: Joi.string().required(),
    filetype: Joi.string().required().optional(),
    name: Joi.string().optional(),
    createdAt: Joi.date().timestamp('javascript').default(null),
    userId: Joi.string()
      .pattern(OBJECT_ID_RULE)
      .message(OBJECT_ID_RULE_MESSAGE),
    userAvatar: Joi.string(),
    userDisplayName: Joi.string()

  }).default([]),
  labels: Joi.array().items({
    _id: Joi.string().required(),
    name: Joi.string().required(),
    color: Joi.string().required(),
    isActive: Joi.boolean().default(false)
  }).default([]),
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
      boardId: new ObjectId(validatedData.boardId),
      labels: validatedData.labels.map(label => {
        return {
          ...label,
          _id: new ObjectId()
        }
      })
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
const unshiftComment = async (cardId, commentData) => {
  try {
    const result = await GET_DB().collection(CARD_COLLECTION_NAME).findOneAndUpdate({
      _id: new ObjectId(cardId)
    }, {
      $push: {
        comments: {
          $each: [commentData],
          $position: 0
        }
      }

    }, {
      returnDocument: 'after'
    })
    return result || null
  } catch (error) {
    throw new Error(error)
  }
}

const unshiftAttachment = async (cardId, attachmentData) => {
  try {
    const result = await GET_DB().collection(CARD_COLLECTION_NAME).findOneAndUpdate({
      _id: new ObjectId(cardId)
    }, {
      $push: {
        attachments: {
          $each: [attachmentData],
          $position: 0
        }
      }
    }, {
      returnDocument: 'after'
    })
    return result || null
  } catch (error) {
    throw new Error(error)
  }
}

const updateMembers = async (cardId, incomingMemberInfo) => {
  try {
    let updateCondition = {}
    if (incomingMemberInfo.action === 'ADD') {
      updateCondition = { $push: { memberIds: new ObjectId(incomingMemberInfo.userId) } }
    }
    if (incomingMemberInfo.action === 'REMOVE') {
      updateCondition = { $pull: { memberIds: new ObjectId(incomingMemberInfo.userId) } }
    }

    const result = await GET_DB().collection(CARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(cardId) },
      updateCondition,
      { returnDocument: 'after' }
    )
    return result || null
  } catch (error) {
    throw new Error(error)
  }
}

const getDetails = async (cardId) => {
  try {
    const result = await GET_DB().collection(CARD_COLLECTION_NAME).aggregate([
      {
        $match: {
          _id: new ObjectId(cardId),
          _destroy: false
        }
      },
      {
        $lookup: {
          from: userModel.USER_COLLECTION_NAME,
          localField: 'memberIds',
          foreignField: '_id',
          as: 'members',
          pipeline: [{ $project: { password: 0, verifyToken: 0 } }]
        }
      }
    ]).toArray()

    return result[0] || null
  } catch (error) {
    throw new Error(error)
  }
}

const deleteAttachment = async (cardId, attachmentId) => {
  try {
    const result = await GET_DB().collection(CARD_COLLECTION_NAME).findOneAndUpdate(
      {
        _id: new ObjectId(cardId)
      },
      { $pull: { attachments: { publicId: attachmentId } } },
      { returnDocument: 'after' }
    )
    return result || null
  } catch (error) {
    throw new Error(error)
  }
}
const archivedCard = async (cardId) => {
  try {
    const result = await GET_DB().collection(CARD_COLLECTION_NAME).findOneAndUpdate(
      {
        _id: new ObjectId(cardId)
      },
      { $set: { _destroy: true } },
      { returnDocument: 'after' }
    )
    return result || null
  } catch (error) {
    throw new Error(error)
  }
}

const createdLabel = async (cardId, labelData) => {
  try {
    // Thêm label vào cuối mảng labels
    const result = await GET_DB().collection(CARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(cardId) },
      { $push: { labels: labelData } },
      { returnDocument: 'after' }
    )
    return result || null
  } catch (error) {
    throw new Error(error)
  }
}

const updateLabel = async (cardId, labelId, data) => {
  try {
    const updateData = {}

    if (data.name !== undefined) {
      updateData['labels.$.name'] = data.name
    }

    if (data.color !== undefined) {
      updateData['labels.$.color'] = data.color
    }

    if (data.isActive !== undefined) {
      updateData['labels.$.isActive'] = data.isActive
    }

    const result = await GET_DB().collection(CARD_COLLECTION_NAME).findOneAndUpdate(
      {
        _id: new ObjectId(cardId),
        'labels._id': new ObjectId(labelId)
      },
      {
        $set: updateData
      },
      { returnDocument: 'after' }
    )
    return result || null
  } catch (error) {
    throw new Error(error)
  }
}
const getLabels = async (cardId, filterStage) => {
  try {
    // Bước 1: Lấy tên cần lọc ra từ filterStage (nếu có)
    const filterName = filterStage?.name || filterStage?.['q[name]'] || filterStage?.q?.name

    // Bước 2: Tìm card theo id, chỉ lấy field "labels" cho nhẹ
    const card = await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .findOne(
        { _id: new ObjectId(cardId) },
        { $project: { labels: 1 } }
      )

    // Bước 3: Nếu không tìm thấy card, trả về mảng rỗng
    const allLabels = card?.labels || []

    // Bước 4: Nếu không có filterName thì trả về hết luôn
    if (!filterName) {
      return { labels: allLabels }
    }

    // Bước 5: Lọc bằng JavaScript thuần, không phân biệt hoa/thường
    const filteredLabels = allLabels.filter(label =>
      label?.name?.toLowerCase().includes(filterName.toLowerCase())
    )

    return { labels: filteredLabels }
  } catch (error) {
    throw new Error(error)
  }
}
export const cardModel = {
  createNew,
  findOneById,
  CARD_COLLECTION_NAME,
  CARD_COLLECTION_SCHEMA,
  updatedCard,
  unshiftComment,
  unshiftAttachment,
  updateMembers,
  getDetails,
  deleteAttachment,
  archivedCard,
  createdLabel,
  updateLabel,
  getLabels
}