import { labelModel } from '~/models/labelModel'
import { cardModel } from '~/models/cardModel'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { redisHelper } from '~/helpers/redisHelper'

const createNew = async (cardId, reqBody) => {
  // eslint-disable-next-line no-useless-catch
  try {
    let data = reqBody
    if (reqBody?.labels && Array.isArray(reqBody.labels) && reqBody.labels.length > 0) {
      data = reqBody.labels[0]
    }

    const result = await labelModel.createNew(cardId, data)
    if (!result) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Label creation failed')
    }

    await redisHelper.delByPattern('labels:*')
    await redisHelper.del('labels')
    await redisHelper.del(`card:${cardId}`)

    const updatedCard = await cardModel.getDetails(cardId)
    if (updatedCard?.boardId) {
      await redisHelper.del(`board:${updatedCard.boardId}`)
    }
    return updatedCard || {}
  } catch (error) {
    throw error
  }
}

const updateLabel = async (cardId, labelId, reqBody) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const data = {}
    if (reqBody.name !== undefined) {
      data.name = reqBody.name
    }
    if (reqBody.color !== undefined) {
      data.color = reqBody.color
    }
    if (reqBody.isActive !== undefined) {
      data.isActive = reqBody.isActive
    }

    const result = await labelModel.updateLabel(cardId, labelId, data)
    if (!result) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Label Not Found!')
    }

    await redisHelper.del(`card:${cardId}`)
    await redisHelper.delByPattern('labels:*')

    const updatedCard = await cardModel.getDetails(cardId)
    if (updatedCard?.boardId) {
      await redisHelper.del(`board:${updatedCard.boardId}`)
    }
    return updatedCard || result
  } catch (error) {
    throw error
  }
}

const getLabels = async (cardId, filterStage) => {
  // eslint-disable-next-line no-useless-catch
  try {
    return await labelModel.getLabels(cardId, filterStage)
  } catch (error) {
    throw error
  }
}

const deleteLabel = async (cardId, labelId) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const result = await labelModel.deleteLabel(cardId, labelId)
    if (!result) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Label Not Found!')
    }

    await redisHelper.del(`card:${cardId}`)
    await redisHelper.delByPattern('labels:*')

    const updatedCard = await cardModel.getDetails(cardId)
    if (updatedCard?.boardId) {
      await redisHelper.del(`board:${updatedCard.boardId}`)
    }
    return updatedCard || result
  } catch (error) {
    throw error
  }
}

export const labelService = {
  createNew,
  updateLabel,
  getLabels,
  deleteLabel
}