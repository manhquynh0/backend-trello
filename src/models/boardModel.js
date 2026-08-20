import Joi from 'joi'
import {
  GET_DB
} from '~/config/database'
import {
  ObjectId
} from 'mongodb'
import {
  cardModel
} from './cardModel'
import {
  columnModel
} from './columnModel'
import {
  BOARD_TYPES
} from '~/utils/constants'
import { pagingSkipValue } from '~/utils/algorithms'
const INVALID_UPDATE_FIELDS = ['_id', 'createdAt']
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
  type: Joi.string().valid(BOARD_TYPES.PUBLIC, BOARD_TYPES.PRIVATE).required(),
  columnOrderIds: Joi.array().items(Joi.string()).default([]),
  ownerIds: Joi.array().items(Joi.string()).default([]),
  memberIds: Joi.array().items(Joi.string()).default([]),
  createdAt: Joi.date().default(Date.now),
  updatedAt: Joi.date().default(Date.now),
  _destroy: Joi.boolean().default(false)

})
const validateBeforeCreate = async (data) => {
  return await BOARD_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false
  })
}
const createNew = async (data) => {
  try {
    const validatedData = await validateBeforeCreate(data)
    const createdBoard = await GET_DB().collection(BOARD_COLLECTION_NAME).insertOne(validatedData)
    return createdBoard
  } catch (error) {
    throw new Error(error)

  }
}
const findOneById = async (id) => {
  try {
    const result = await GET_DB().collection(BOARD_COLLECTION_NAME).findOne({
      _id: new ObjectId(id)
    })
    return result
  } catch (error) {
    throw new Error(error)
  }
}
const getDetails = async (id) => {
  try {
    const result = await GET_DB().collection(BOARD_COLLECTION_NAME).aggregate([
      {
        $match: {
          _id: new ObjectId(id),
          _destroy: false
        }
      },
      {
        $lookup: {
          from: columnModel.COLUMN_COLLECTION_NAME,
          localField: '_id',
          foreignField: 'boardId',
          as: 'columns' // tự động sinh ra
        }
      },
      {
        $lookup: {
          from: cardModel.CARD_COLLECTION_NAME,
          localField: '_id',
          foreignField: 'boardId',
          as: 'cards'
        }
      }
    ]).toArray()
    const board = result[0] || {}
    board.columns = board.columns.filter(column => !column._destroy)

    return board
  } catch (error) {
    throw new Error(error)

  }
}
const pushColumnOrderIds = async (column) => {
  try {
    const result = await GET_DB().collection(BOARD_COLLECTION_NAME).findOneAndUpdate({
      _id: new ObjectId(column.boardId)
    }, {
      $push: {
        columnOrderIds: new ObjectId(column._id)
      }
    }, {
      ReturnDocument: 'after'
    })
    return result || null
  } catch (error) {
    throw new Error(error)
  }
}
const updateBoard = async (boardId, updateData) => {
  try {
    Object.keys(updateData).forEach(fieldName => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName)) {
        delete updateData[fieldName]
      }
    })
    if (updateData.columnOrderIds) {
      updateData.columnOrderIds = updateData.columnOrderIds.map(_id =>
        (new ObjectId(_id))
      )
    }
    const result = await GET_DB().collection(BOARD_COLLECTION_NAME).findOneAndUpdate({
      _id: new ObjectId(boardId)
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
const getBoards = async (userId, page, itemperpage) => {
  try {
    const queryConditons = [
      {
        _destroy: false
      },
      {
        $or: [
          {
            ownerIds: {
              $all: [new ObjectId(userId)]
            }
          },
          {
            memberIds: {
              $all: [new ObjectId(userId)]
            }
          }
        ]
      }
    ]

    const query = await GET_DB().collection(BOARD_COLLECTION_NAME).aggregate(
      [
        { $match : { $and : queryConditons } },
        { $sort : { createdAt : 1 } },
        // facet : xu ly nhieu luong trong 1 query
        { $facet : {
          // luong 01 : query boards
          'queryBoards' : [
            {
              $skip : pagingSkipValue(page, itemperpage)
            },
            {
              $limit : itemperpage // toi da 10 ban ghi tren 1 page
            }
          ],

          // luong 02 : query tong so luong tat cac cac ban ghi board trong db
          'queryTotalBoards' : [
            {
              $count : 'countedAllBoards'
            }
          ]
        } }
      ],
      {
        collation : { locale : 'en' } // xu ly trong truong hop sort theo ten ASCII
      }
    ).toArray()

    console.log(query)
    const res = query[0]

    return {
      boards : res.queryBoards || [],
      totalBoards : res.queryTotalBoards[0]?.countedAllBoards || 0
    }
  } catch (error) {
    throw new Error(error)
  }
}
export const boardModel = {
  BOARD_COLLECTION_NAME,
  BOARD_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  getDetails,
  pushColumnOrderIds,
  updateBoard,
  getBoards
}