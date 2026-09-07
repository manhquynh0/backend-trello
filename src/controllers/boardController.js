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
const getFilteredDetails = async (req, res, next) => {
  try {
    const board = await boardService.getFilteredDetails(req.jwtDecoded._id, req.params.id, req.query)
    res.status(StatusCodes.OK).json(board)
  } catch (error) {
    next(error)
  }
}
const updateBoard = async (req, res, next) => {
  try {
    const boardCoverFile = req.file
    const boardId = req.params.id
    const updateBoard = await boardService.updateBoard(boardId, req.body, boardCoverFile)
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
      itemperpage,
      q
    } = req.query

    // q gửi từ FE dạng q[title]=abc sẽ được Express parse thành object { title: 'abc' }
    const queryFilter = q
    const getBoards = await boardService.getBoards(userID, page, itemperpage, queryFilter)
    res.status(StatusCodes.OK).json(getBoards)
  } catch (error) {
    next(error)
  }
}
const deleteBoard = async (req, res, next) => {
  try {
    const boardId = req.params.id
    const deleteBoard = await boardService.deleteBoard(boardId)
    res.status(StatusCodes.OK).json(deleteBoard)
  } catch (error) {
    next(error)
  }
}
const archiveBoard = async (req, res, next) => {
  try {
    const boardId = req.params.id
    const archiveBoard = await boardService.archiveBoard(boardId)
    res.status(StatusCodes.OK).json(archiveBoard)
  } catch (error) {
    next(error)
  }
}
const undoBoard = async (req, res, next) => {
  try {
    const boardId = req.params.id
    const undoBoard = await boardService.undoBoard(boardId)
    res.status(StatusCodes.OK).json(undoBoard)
  } catch (error) {
    next(error)
  }
}
export const boardController = {
  createdNew,
  getDetails,
  updateBoard,
  movingCard,
  getBoards,
  deleteBoard,
  archiveBoard,
  undoBoard,
  getFilteredDetails
}