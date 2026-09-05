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
const createdAttachment = async (req, res, next) => {
  try {
    const cardId = req.params.id
    const userInfor = req.jwtDecoded
    const updated = await cardService.createdAttachment(cardId, req.body, userInfor)
    res.status(StatusCodes.CREATED).json(updated)
  } catch (error) {
    next(error)
  }
}
const archivedCard = async (req, res, next) => {
  try {
    const cardId = req.params.id
    const updatedCard = await cardService.archivedCard(cardId)
    res.status(StatusCodes.OK).json(updatedCard)
  } catch (error) {
    next(error)
  }
}
const getLabels = async (req, res, next) => {
  try {
    const cardId = req.params.id
    const filterStage = req.query
    const labels = await cardService.getLabels(cardId, filterStage)
    res.status(StatusCodes.OK).json(labels)
  } catch (error) {
    next(error)
  }
}
const createdLabel = async (req, res, next) => {
  try {
    const cardId = req.params.id
    const updated = await cardService.createdLabel(cardId, req.body)
    res.status(StatusCodes.CREATED).json(updated)
  } catch (error) {
    next(error)
  }
}
const deleteLabel = async (req, res, next) => {
  try {
    const cardId = req.params.id
    const updatedCard = await cardService.deletedLabel(cardId)
    res.status(StatusCodes.OK).json(updatedCard)
  } catch (error) {
    next(error)
  }
}
const updateLabel = async (req, res, next) => {
  try {
    const cardId = req.params.id
    const labelId = req.params.labelId
    const updatedCard = await cardService.updateLabel(cardId, labelId, req.body)
    res.status(StatusCodes.OK).json(updatedCard)
  } catch (error) {
    next(error)
  }
}
const createdChecklist = async (req, res, next) => {
  try {
    const cardId = req.params.id
    const updated = await cardService.createdChecklist(cardId, req.body)
    res.status(StatusCodes.CREATED).json(updated)
  } catch (error) {
    next(error)
  }
}
const createdChecklistItem = async (req, res, next) => {
  try {
    const cardId = req.params.id
    const checklistId = req.params.checklistId
    const updated = await cardService.createdChecklistItem(cardId, checklistId, req.body)
    res.status(StatusCodes.CREATED).json(updated)
  } catch (error) {
    next(error)
  }
}
export const cardController = {
  createdNew,
  getDetails,
  updated,
  deleteAttachment,
  createdAttachment,
  archivedCard,
  getLabels,
  createdLabel,
  deleteLabel,
  updateLabel,
  createdChecklist,
  createdChecklistItem
}