/* eslint-disable no-useless-catch */
import {
  StatusCodes
} from 'http-status-codes'
import ApiError from '../utils/ApiError'
import {
  slugify
} from '../utils/formatter'
import {
  boardModel
} from '~/models/boardModel'
import {
  cardModel
} from '~/models/cardModel'
import {
  columnModel
} from '~/models/columnModel'
import {
  cloneDeep
} from 'lodash'
import {
  DEFAULT_ITEM_PERPAGE,
  DEFAULT_PAGE
} from '~/utils/constants'
import {
  redisHelper
} from '~/helpers/redisHelper'
import { CloudinaryProvider } from '~/providers/CloudinaryProvider'
const dragTimers = new Map()
const createNew = async (userId, reqBody) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const newBoard = {
      ...reqBody,
      slug: slugify(reqBody.title)
    }
    const createdBoard = await boardModel.createNew(userId, newBoard)

    const getNewBoard = await boardModel.findOneById(createdBoard.insertedId)
    if (getNewBoard) {
      await redisHelper.delByPattern('boards:*')
      await redisHelper.del('boards')
    }
    return getNewBoard
  } catch (error) {
    throw error
  }
}
const getDetails = async (userId, boardId) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const key = `board:${boardId}`
    const cacheBoarad = await redisHelper.get(key)
    if (cacheBoarad) {
      return cacheBoarad
    }
    const board = await boardModel.getDetails(userId, boardId)
    if (!board) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Board Not Found')
    }


    const resBoard = cloneDeep(board) // clone board
    resBoard?.columns?.forEach(column => {
      column.cards = resBoard?.cards.filter(card => {
        return card.columnId?.toString() === column._id?.toString()
      })
    })
    delete resBoard?.cards
    await redisHelper.set(key, resBoard)
    return resBoard || {}

  } catch (error) {
    throw error
  }
}
const updateBoard = async (boardId, reqBody, boardCoverFile) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const key = `board:${boardId}`
    const updateData = {
      ...reqBody,
      updatedAt: Date.now()
    }
    let updateBoard = {}
    if (boardCoverFile) {
      const uploadResult = await CloudinaryProvider.streamUpload(boardCoverFile.buffer, 'board-covers')
      updateBoard = await boardModel.updateBoard(boardId, {
        cover: uploadResult.secure_url
      })

    }
    updateBoard = await boardModel.updateBoard(boardId, updateData)

    // Xóa cache chi tiết Board và danh sách Boards để cập nhật dữ liệu mới nhất (ví dụ: isFavorite, title...)
    await redisHelper.del(key)
    await redisHelper.delByPattern('boards:*')
    await redisHelper.del('boards')

    return updateBoard
  } catch (error) {
    throw error
  }
}
const syncDragDataToMongoDB = async (boardId) => {
  try {
    const keyDrag = `drag:${boardId}`
    const lastDragData = await redisHelper.get(keyDrag)

    if (!lastDragData) return
    const {
      currentCardId,
      prevColumnId,
      prevCardOrderIds,
      nextColumnId,
      nextCardOrderIds
    } = lastDragData
    await columnModel.updatedColumn(prevColumnId, {
      cardOrderIds: prevCardOrderIds
    })

    await columnModel.updatedColumn(nextColumnId, {
      cardOrderIds: nextCardOrderIds
    })

    await cardModel.updatedCard(currentCardId, {
      columnId: nextColumnId
    })

    await redisHelper.del(keyDrag)
    return {
      updateResult: 'Successfully'
    }
  } catch (error) {
    throw error
  }

}
const movingCard = async (reqBody) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const {
      boardId
    } = reqBody

    const keyDrag = `drag:${boardId}`
    // Lưu giá trị kéo thả vào redis
    await redisHelper.set(keyDrag, reqBody, 60)

    const keyBoard = `board:${boardId}`

    // Xóa dữ liệu cacheBoard cũ
    await redisHelper.del(keyBoard)
    // Xử lý debounce
    // Nếu trong vòng 2s có hành động kéo thả mới thì xóa hẹn giờ cũ ( set về 0)
    if (dragTimers.has(boardId)) {
      clearTimeout(dragTimers.get(boardId))
    }

    // Đặt hẹn giờ

    const time = setTimeout(() => {
      syncDragDataToMongoDB(boardId),
        // Xóa khỏi thông tin khỏi Map
        dragTimers.delete(boardId)

    }, 500)

    // Lưu thông tin vào Map
    dragTimers.set(boardId, time)
    return { updateResult: 'Successfully' }

  } catch (error) {
    throw error
  }
}
const getBoards = async (userID, page, itemperpage, queryFilter) => {
  // eslint-disable-next-line no-useless-catch
  try {
    if (!page) page = DEFAULT_PAGE
    if (!itemperpage) itemperpage = DEFAULT_ITEM_PERPAGE

    // Tạo key unique duy nhất theo từng User, Page và Từ khóa tìm kiếm (Query)
    const key = `boards:${userID}:p${page}:l${itemperpage}:q${JSON.stringify(queryFilter || {})}`
    const cacheAllBoards = await redisHelper.get(key)
    if (cacheAllBoards) {
      return cacheAllBoards
    }

    const results = await boardModel.getBoards(userID, parseInt(page, 10), parseInt(itemperpage, 10), queryFilter)
    await redisHelper.set(key, results)
    return results
  } catch (error) {
    throw error
  }
}
const deleteBoard = async (boardId) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const board = await boardModel.findOneById(boardId)
    if (!board) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Board Not Found')
    }
    const deleteBoard = await boardModel.deleteBoard(boardId)
    await redisHelper.delByPattern('boards:*')
    await redisHelper.del('boards')
    return deleteBoard
  } catch (error) {
    throw error
  }
}
const archiveBoard = async (boardId) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const board = await boardModel.findOneById(boardId)
    if (!board) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Board Not Found')
    }
    const dataUpdate = {
      _destroy: true,
      deletedAt: Date.now(),
      updatedAt: Date.now()
    }
    const archiveBoard = await boardModel.archiveBoard(boardId, dataUpdate)
    await redisHelper.delByPattern('boards:*')
    await redisHelper.del('boards')
    return archiveBoard
  } catch (error) {
    throw error
  }
}
const undoBoard = async (boardId) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const board = await boardModel.findOneById(boardId)
    if (!board) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Board Not Found')
    }
    const dataUpdate = {
      _destroy: false,
      deletedAt: null,
      updatedAt: Date.now()
    }
    const undoBoard = await boardModel.undoBoard(boardId, dataUpdate)
    await redisHelper.delByPattern('boards:*')
    await redisHelper.del('boards')
    return undoBoard
  } catch (error) {
    throw error
  }
}
export const boardService = {
  createNew,
  getDetails,
  updateBoard,
  movingCard,
  getBoards,
  deleteBoard,
  archiveBoard,
  undoBoard
}