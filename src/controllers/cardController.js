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
    const cardCoverFile = req.files?.cardCover?.[0]
    const attachmentsFiles = req.files?.attachments?.[0]
    const updated = await cardService.updatedCard(cardId, req.body, cardCoverFile, attachmentsFiles, userInfor)
    res.status(StatusCodes.CREATED).json(updated)
  } catch (error) {
    next(error)
  }
}
const deleteAttachment = async (req, res, next) => {
  try {
    const cardId = req.params.cardId
    const attachmentId = req.params.publicId || req.params[0]
    const updatedCard = await cardService.deleteAttachment(cardId, attachmentId)
    res.status(StatusCodes.OK).json(updatedCard)
  } catch (error) {
    next(error)
  }
}
export const cardController = {
  createdNew,
  getDetails,
  updated,
  deleteAttachment
}