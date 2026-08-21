import StatusCodes from 'http-status-codes'
import {
  boardService
} from '~/services/boardService'
const createdNew = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const createdBoard = await boardService.createNew(userId, req.body)
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
    const userId = req.jwtDecoded._id
    const boardId = req.params.id
    const board = await boardService.getDetails(userId, boardId)
    res.status(StatusCodes.OK).json(board)
  } catch (error) {
    next(error)
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
const movingCard = async (req, res, next) => {
  try {
    const updateBoard = await boardService.movingCard(req.body)
    res.status(StatusCodes.OK).json(updateBoard)
  } catch (error) {
    next(error)
  }
}
const getBoards = async (req, res, next) => {
  try {
    const userID = req.jwtDecoded._id
    const {
      page,
      itemperpage
    } = req.query
    const getBoards = await boardService.getBoards(userID, page, itemperpage)
    res.status(StatusCodes.OK).json(getBoards)
  } catch (error) {
    next(error)
  }
}
export const boardController = {
  createdNew,
  getDetails,
  updateBoard,
  movingCard,
  getBoards
}