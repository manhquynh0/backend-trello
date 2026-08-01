import StatusCodes from 'http-status-codes'
import {
  boardService
} from '~/services/boardService'
const createdNew = async (req, res, next) => {
  try {
    const createdBoard = await boardService.createNew(req.body)
    res.status(StatusCodes.CREATED).json(createdBoard)
  } catch (error) {
    next(error)
    // res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    //   errors: error.message
    // })
  }
}
const getDetails = async (req, res, next) => {
  try {
    const boardId = req.params.id
    const board = await boardService.getDetails(boardId)
    res.status(StatusCodes.OK).json(board)
  } catch (error) {
    next(error)
    // res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    //   errors: error.message
    // })
  }
}
const updateBoard = async (req, res, next) => {
  try {
    const boardId = req.params.id
    const updateBoard = await boardService.updateBoard(boardId, req.body)
    res.status(StatusCodes.OK).json(updateBoard)
  } catch (error) {
    next(error)
  }
}
export const boardController = {
  createdNew,
  getDetails,
  updateBoard
}