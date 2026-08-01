import {
  StatusCodes
} from 'http-status-codes'
import ApiError from '../utils/ApiError'
import slugify from '../utils/formatter'
import {
  boardModel
} from '~/models/boardModel'
import {
  cloneDeep
} from 'lodash'
const createNew = async (reqBody) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const newBoard = {
      ...reqBody,
      slug: slugify(reqBody.title)
    }
    const createdBoard = await boardModel.createNew(newBoard)

    const getNewBoard = await boardModel.findOneById(createdBoard.insertedId)
    return getNewBoard
  } catch (error) {
    throw error
  }
}
const getDetails = async (boardId) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const board = await boardModel.getDetails(boardId)
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
export const boardService = {
  createNew,
  getDetails,
  updateBoard
}