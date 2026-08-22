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
    const userInfor = req.jwtDecoded
    const cardCoverFile = req.file
    const updated = await cardService.updatedCard(cardId, req.body, cardCoverFile, userInfor)
    res.status(StatusCodes.CREATED).json(updated)
  } catch (error) {
    next(error)
  }
}
export const cardController = {
  createdNew,
  getDetails,
  updated
}