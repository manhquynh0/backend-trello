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
import {
  userModel
} from './userModel'
import {
  pagingSkipValue
} from '~/utils/algorithms'
import { createIndexes } from '~/config/createIndexs'
const INVALID_UPDATE_FIELDS = ['_id', 'createdAt']
const COLUMN_COLLECTION_NAME = 'columns'
const CARD_COLLECTION_NAME = 'cards'
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
  cover: Joi.string().default(null),
  isFavorite: Joi.boolean().default(false),
  type: Joi.string().valid(BOARD_TYPES.PUBLIC, BOARD_TYPES.PRIVATE).required(),
  columnOrderIds: Joi.array().items(Joi.string()).default([]),
  ownerIds: Joi.array().items(Joi.string()).default([]),
  memberIds: Joi.array().items(Joi.string()).default([]),
  createdAt: Joi.date().default(Date.now),
  updatedAt: Joi.date().default(Date.now),
  deletedAt: Joi.date().default(null),
  _destroy: Joi.boolean().default(false)

})
const validateBeforeCreate = async (data) => {
  return await BOARD_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false
  })
}
const createNew = async (userId, data) => {
  try {
    const validatedData = await validateBeforeCreate(data)
    const newBoardtoAdd = {
      ...validatedData,
      ownerIds: [new ObjectId(userId)]
    }
    const createdBoard = await GET_DB().collection(BOARD_COLLECTION_NAME).insertOne(newBoardtoAdd)
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
const getDetails = async (userId, boardId) => {
  try {
    const queryConditons = [
      {
        _id: new ObjectId(boardId)
      },
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
    const result = await GET_DB().collection(BOARD_COLLECTION_NAME).aggregate([
      {
        $match: {
          $and: queryConditons
        }
      },
      {
        $lookup: {
          from: columnModel.COLUMN_COLLECTION_NAME,
          localField: '_id',
          foreignField: 'boardId',
          as: 'columns',
          pipeline: [
            {
              $match: {
                _destroy: false
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: cardModel.CARD_COLLECTION_NAME,
          localField: '_id',
          foreignField: 'boardId',
          as: 'cards',
          pipeline: [
            {
              $match: {
                _destroy: false
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: userModel.USER_COLLECTION_NAME,
          localField: 'ownerIds',
          foreignField: '_id',
          as: 'owners', // tự động sinh ra,
          //pipeline : trong lọokup là để xử lý một hoặc nhiều luồng cần thiết
          // $project để chỉ định vài field không muốn lấy về bằng cách gán giá trị = 0

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
          localField: 'memberIds',
          foreignField: '_id',
          as: 'members',
          pipeline: [{
            $project: {
              'password': 0,
              'verifyToken': 0
            }
          }]
        }
      }
    ]).toArray()
    const board = result[0]
    if (!board) return null

    if (board.columns) {
      board.columns = board.columns.filter(column => !column._destroy)
    }

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
      returnDocument: 'after'
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
const getBoards = async (userId, page, itemperpage, queryFilter) => {
  try {
    const isTrash = queryFilter?.type === 'trash'
    const queryConditons = [
      {
        _destroy: isTrash ? true : false
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
    // sort & filterStage chỉ áp dụng cho danh sách hiển thị (queryBoards), giữ nguyên đếm tổng ở facet

    //sort
    let sortStage = {}
    if (queryFilter?.sort === 'newest') {
      sortStage = {
        createdAt: -1
      }
    } else if (queryFilter?.sort === 'oldest') {
      sortStage = {
        createdAt: 1
      }
    } else if (queryFilter?.sort === 'name') {
      sortStage = {
        title: 1
      }
    } else {
      sortStage = {
        createdAt: -1
      }
    }

    let filterStage = {}

    if (queryFilter?.title) {
      filterStage.title = {
        $regex: queryFilter.title,
        $options: 'i'
      }
    }

    if (queryFilter?.type === 'favorite') {
      filterStage.isFavorite = true
    }

    if (queryFilter?.type === 'public') {
      filterStage.type = BOARD_TYPES.PUBLIC
    }

    if (queryFilter?.type === 'private') {
      filterStage.type = BOARD_TYPES.PRIVATE
    }

    const query = await GET_DB().collection(BOARD_COLLECTION_NAME).aggregate(
      [
        {
          $match: {
            $and: queryConditons
          }
        },
        {
          $lookup: {
            from: userModel.USER_COLLECTION_NAME,
            localField: 'memberIds',
            foreignField: '_id',
            as: 'members',
            pipeline: [{
              $project: {
                'password': 0,
                'verifyToken': 0
              }
            }]
          }
        },
        // facet : xu ly nhieu luong trong 1 query
        {
          $facet: {
            // luong 01 : query boards
            'queryBoards': [
              {
                $match: filterStage
              },
              {
                $sort: sortStage
              },
              {
                $skip: pagingSkipValue(page, itemperpage)
              },
              {
                $limit: itemperpage // toi da 10 ban ghi tren 1 page
              }
            ],

            // luong 02 : query tong so luong tat cac cac ban ghi board trong db
            'queryTotalBoards': [{
              $count: 'countedAllBoards' // dem tong so luong bang roi luu vao bien countedAllBoards
            }],
            // luong 03 : query tong so luong tat cac cac ban ghi board trong db
            'queryFavoriteBoards': [
              {
                $match: {
                  isFavorite: true
                }
              },
              {
                $count: 'countedFavoriteBoards'
              }
            ],
            'queryPublicBoards': [
              {
                $match: {
                  type: BOARD_TYPES.PUBLIC
                }
              },
              {
                $count: 'countedPublicBoards'
              }
            ],
            'queryPrivateBoards': [
              {
                $match: {
                  type: BOARD_TYPES.PRIVATE
                }
              },
              {
                $count: 'countedPrivateBoards'
              }
            ]
          }
        }
      ], {
      collation: {
        locale: 'en'
      } // xu ly trong truong hop sort theo ten ASCII
    }
    ).toArray()
    const res = query[0] // query la mot mang

    return {
      boards: res.queryBoards || [],
      totalBoards: res.queryTotalBoards[0]?.countedAllBoards || 0,
      totalFavoriteBoards: res.queryFavoriteBoards[0]?.countedFavoriteBoards || 0,
      totalPublicBoards: res.queryPublicBoards[0]?.countedPublicBoards || 0,
      totalPrivateBoards: res.queryPrivateBoards[0]?.countedPrivateBoards || 0
    }
  } catch (error) {
    throw new Error(error)
  }
}
const pushMemberIds = async (boardId, userId) => {
  try {
    const result = await GET_DB().collection(BOARD_COLLECTION_NAME).findOneAndUpdate({
      _id: new ObjectId(boardId)
    }, {
      $push: {
        memberIds: new ObjectId(userId)
      }
    }, {
      returnDocument: 'after'
    })
    return result || null
  } catch (error) {
    throw new Error(error)
  }
}
const deleteBoard = async (boardId) => {
  try {
    const result = await GET_DB().collection(BOARD_COLLECTION_NAME).deleteOne({
      _id: new ObjectId(boardId)
    })

    await GET_DB().collection(COLUMN_COLLECTION_NAME).deleteMany({
      boardId: new ObjectId(boardId)
    })

    await GET_DB().collection(CARD_COLLECTION_NAME).deleteMany({
      boardId: new ObjectId(boardId)
    })

    return result || null
  } catch (error) {
    throw new Error(error)
  }
}
const archiveBoard = async (boardId, dataUpdate) => {
  try {
    const result = await GET_DB().collection(BOARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(boardId) },
      { $set: dataUpdate },
      { returnDocument: 'after' }
    )
    return result || null
  } catch (error) {
    throw new Error(error)
  }
}
const undoBoard = async (boardId, dataUpdate) => {
  try {
    const result = await GET_DB().collection(BOARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(boardId) },
      { $set: dataUpdate },
      { returnDocument: 'after' }
    )
    return result || null
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
  pushMemberIds,
  pushColumnOrderIds,
  updateBoard,
  getBoards,
  deleteBoard,
  archiveBoard,
  undoBoard
}