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
export const boardController = {
  createdNew
}