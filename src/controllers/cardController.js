import StatusCodes from 'http-status-codes'
import {
  cardService
} from '~/services/cardService'
const createdNew = async (req, res, next) => {
  try {
    const createdcard = await cardService.createNew(req.body)
    res.status(StatusCodes.CREATED).json(createdcard)
  } catch (error) {
    next(error)
  }
}
const getDetails = async (req, res, next) => {
  try {
    const cardId = req.params.id
    const card = await cardService.getDetails(cardId)
    res.status(StatusCodes.OK).json(card)
  } catch (error) {
    next(error)
    // res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    //   errors: error.message
    // })
  }
}
const updated = async (req, res, next) => {
  try {
    const cardId = req.params.id
    const createdcard = await cardService.updatedCard(cardId, req.body)
    res.status(StatusCodes.CREATED).json(createdcard)
  } catch (error) {
    next(error)
  }
}
export const cardController = {
  createdNew,
  getDetails,
  updated
}