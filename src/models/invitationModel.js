import Joi from 'joi'
import {
  GET_DB
} from '~/config/database'
import {
  ObjectId
} from 'mongodb'
import {
  OBJECT_ID_RULE,
  OBJECT_ID_RULE_MESSAGE
} from '~/utils/validators'
import {
  userModel
} from './userModel'
import {
  boardModel
} from './boardModel'
import {
  INVITATION_TYPE,
  BOARD_INVITATION_STATUS
} from '~/utils/constants'
const INVALID_UPDATE_FIELDS = ['_id', 'inviterId', 'inviteeId', 'type', 'createdAt']
const INVITATION_COLLECTION_NAME = 'invitations'
const INVITATION_COLLECTION_SCHEMA = Joi.object({
  inviterId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE), // người mời
  inviteeId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE), // người được mời
  type: Joi.string().required().valid(...Object.values(INVITATION_TYPE)),

  // Lời mời là board thì sẽ lưu thêm dữ liệu boardInvitation - optional
  boardInvitation: Joi.object({
    boardId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
    status: Joi.string().required().valid(...Object.values(BOARD_INVITATION_STATUS))
  }).optional(),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)

})
const validateBeforeCreate = async (data) => {
  return await INVITATION_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false
  })
}
const createNew = async (data) => {
  try {
    const validatedData = await validateBeforeCreate(data)
    let newInvitaitontoAdd = {
      ...validatedData,
      inviterId: new ObjectId(validatedData.inviterId),
      inviteeId: new ObjectId(validatedData.inviteeId)
    }
    if (validatedData.boardInvitation) {
      newInvitaitontoAdd.boardInvitation = {
        ...validatedData.boardInvitation,
        boardId: new ObjectId(validatedData.boardInvitation.boardId)
      }
    }


    // Nếu tồn tại boardInvitation thì update cho cái boardId
    const created = await GET_DB().collection(INVITATION_COLLECTION_NAME).insertOne(newInvitaitontoAdd)
    return created
  } catch (error) {
    throw new Error(error)

  }
}
const findByUser = async (userId) => {
  try {
    const queryConditons = [
      {
        inviteeId: new ObjectId(userId)
      },
      {
        _destroy: false
      }
    ]
    const results = await GET_DB().collection(INVITATION_COLLECTION_NAME).aggregate([
      {
        $match: {
          $and: queryConditons
        }
      },
      {
        $lookup: {
          from: userModel.USER_COLLECTION_NAME,
          localField: 'inviterId',
          foreignField: '_id',
          as: 'inviter',
          pipeline: [{
            $project: {
              'password': 0,
              'verifyToken': 0
            }
          }]
        }
      },
      {
        $lookup: {
          from: userModel.USER_COLLECTION_NAME,
          localField: 'inviteeId',
          foreignField: '_id',
          as: 'invitee',
          pipeline: [{
            $project: {
              'password': 0,
              'verifyToken': 0
            }
          }]
        }
      },
      {
        $lookup: {
          from: boardModel.BOARD_COLLECTION_NAME,
          localField: 'boardInvitation.boardId',
          foreignField: '_id',
          as: 'board'
        }
      }
    ]).toArray()
    return results
  } catch (error) {
    throw new Error(error)

  }
}
const findOneById = async (id) => {
  try {
    const result = await GET_DB().collection(INVITATION_COLLECTION_NAME).findOne({
      _id: new ObjectId(id)
    })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const update = async (invitationId, updateData) => {
  try {
    const result = await GET_DB().collection(INVITATION_COLLECTION_NAME).findOneAndUpdate({
      _id: new ObjectId(invitationId)
    }, {
      $set: {
        ...updateData,
        updatedAt: Date.now()
      }

    }, {
      returnDocument: 'after'
    })
    return result || null
  } catch (error) {
    throw new Error(error)
  }
}
export const invitationModel = {
  INVITATION_COLLECTION_NAME,
  INVITATION_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  update,
  findByUser
}