import StatusCodes from 'http-status-codes'
import { labelService } from '~/services/labelService'

const createNew = async (req, res, next) => {
  try {
    const cardId = req.params.id || req.params.cardId
    const createLabel = await labelService.createNew(cardId, req.body)
    res.status(StatusCodes.CREATED).json(createLabel)
  } catch (error) {
    next(error)
  }
}

const getLabels = async (req, res, next) => {
  try {
    const cardId = req.params.id || req.params.cardId
    const filterStage = req.query
    const labels = await labelService.getLabels(cardId, filterStage)
    res.status(StatusCodes.OK).json(labels)
  } catch (error) {
    next(error)
  }
}

const updateLabel = async (req, res, next) => {
  try {
    const cardId = req.params.id || req.params.cardId
    const labelId = req.params.labelId
    const updatedLabel = await labelService.updateLabel(cardId, labelId, req.body)
    res.status(StatusCodes.OK).json(updatedLabel)
  } catch (error) {
    next(error)
  }
}

const deleteLabel = async (req, res, next) => {
  try {
    const cardId = req.params.id || req.params.cardId
    const labelId = req.params.labelId
    const result = await labelService.deleteLabel(cardId, labelId)
    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

export const labelController = {
  createNew,
  getLabels,
  updateLabel,
  deleteLabel
}