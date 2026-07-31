import StatusCodes from 'http-status-codes'
import {
  columnService
} from '~/services/columnService'
const createdNew = async (req, res, next) => {
  try {
    const createdcolumn = await columnService.createNew(req.body)
    res.status(StatusCodes.CREATED).json(createdcolumn)
  } catch (error) {
    next(error)
    // res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    //   errors: error.message
    // })
  }
}
const getDetails = async (req, res, next) => {
  try {
    const columnId = req.params.id
    const column = await columnService.getDetails(columnId)
    res.status(StatusCodes.OK).json(column)
  } catch (error) {
    next(error)
    // res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    //   errors: error.message
    // })
  }
}
export const columnController = {
  createdNew,
  getDetails
}