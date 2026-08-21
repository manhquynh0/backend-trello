import {
  StatusCodes
} from 'http-status-codes'
import ApiError from '../utils/ApiError'
import { slugify } from '../utils/formatter'
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
const createNew = async (userId, reqBody) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const newBoard = {
      ...reqBody,
      slug: slugify(reqBody.title)
    }
    const createdBoard = await boardModel.createNew(userId, newBoard)

    const getNewBoard = await boardModel.findOneById(createdBoard.insertedId)
    return getNewBoard
  } catch (error) {
    throw error
  }
}
const getDetails = async (userId, boardId) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const board = await boardModel.getDetails(userId, boardId)
    if (!board) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Board Not Found')
    }


    const resBoard = cloneDeep(board) // clone board
    resBoard.columns.forEach(column => {
      column.cards = resBoard.cards.filter(card => {
        return card.columnId.equals(column._id)
      })
    })
    delete resBoard.cards
    return resBoard

  } catch (error) {
    throw error
  }
}
const updateBoard = async (boardId, reqBody) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const updateData = {
      ...reqBody,
      updatedAt: Date.now()
    }
    const updateBoard = await boardModel.updateBoard(boardId, updateData)

    return updateBoard
  } catch (error) {
    throw error
  }
}
const movingCard = async (reqBody) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const {
      currentCardId,
      prevColumnId,
      prevCardOrderIds,
      nextColumnId,
      nextCardOrderIds
    } = reqBody
    await columnModel.updatedColumn(prevColumnId, {
      cardOrderIds: prevCardOrderIds
    })

    await columnModel.updatedColumn(nextColumnId, {
      cardOrderIds: nextCardOrderIds
    })

    await cardModel.updatedCard(currentCardId, {
      columnId: nextColumnId
    })
    return {
      updateResult: 'Successfully'
    }
  } catch (error) {
    throw error
  }
}
const getBoards = async (userID, page, itemperpage) => {
  // eslint-disable-next-line no-useless-catch
  try {
    if (!page) page = DEFAULT_PAGE
    if (!itemperpage) itemperpage = DEFAULT_ITEM_PERPAGE
    const results = await boardModel.getBoards(userID, parseInt(page, 10), parseInt(itemperpage, 10))
    return results
  } catch (error) {
    throw error
  }
}
export const boardService = {
  createNew,
  getDetails,
  updateBoard,
  movingCard,
  getBoards
}