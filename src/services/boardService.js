import {
  StatusCodes
} from 'http-status-codes'
import ApiError from '../utils/ApiError'
import slugify from '../utils/formatter'
import {
  boardModel,
  findOneById
} from '~/models/boardModel'
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
    return board
  } catch (error) {
    throw error
  }
}
export const boardService = {
  createNew,
  getDetails
}