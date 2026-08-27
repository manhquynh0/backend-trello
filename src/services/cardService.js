import {
  StatusCodes
} from 'http-status-codes'
import ApiError from '../utils/ApiError'
import {
  cardModel
} from '~/models/cardModel'
import {
  columnModel
} from '../models/columnModel'
import {
  CloudinaryProvider
} from '~/providers/CloudinaryProvider'
import { redisHelper } from '~/helpers/redisHelper'
const createNew = async (reqBody) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const newcard = {
      ...reqBody
    }
    const createdcard = await cardModel.createNew(newcard)

    const getNewcard = await cardModel.findOneById(createdcard.insertedId)
    if (getNewcard) {
      await columnModel.pushCardOrderIds(getNewcard)
    }
    return getNewcard
  } catch (error) {
    throw error
  }
}
const getDetails = async (cardId) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const key = `card:${cardId}`
    const cacheCard = await redisHelper.get(key)
    if (cacheCard) {
      return cacheCard
    }
    const card = await cardModel.getDetails(cardId)
    if (!card) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Card Not Found!')
    }
    await redisHelper.set(key, card)
    return card
  } catch (error) {
    throw error
  }
}
const updatedCard = async (cardId, reqBody, cardCoverFile, userInfor) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const key = `card:${cardId}`
    const updateData = {
      ...reqBody,
      updatedAt: Date.now()
    }
    let updateCard = {}
    if (cardCoverFile) {
      const uploadResult = await CloudinaryProvider.streamUpload(cardCoverFile.buffer, 'card-covers')
      updateCard = await cardModel.updatedCard(cardId, {
        cover: uploadResult.secure_url
      })

    } else if (updateData.commentToAdd) {
      const commentData = {
        ...updateData.commentToAdd,
        commentAt: Date.now(),
        userId: userInfor._id,
        userEmail: userInfor.email
      }
      updateCard = await cardModel.unshiftComment(cardId, commentData)

    } else if (updateData.incomingMemberInfo) {
      updateCard = await cardModel.updateMembers(cardId, updateData.incomingMemberInfo)

    } else {
      updateCard = await cardModel.updatedCard(cardId, updateData)
    }
    await redisHelper.del(key)

    return updateCard
  } catch (error) {
    throw error
  }
}
export const cardService = {
  createNew,
  getDetails,
  updatedCard
}