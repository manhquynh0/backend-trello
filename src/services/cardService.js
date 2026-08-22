import {
  StatusCodes
} from 'http-status-codes'
import ApiError from '../utils/ApiError'
import {
  cardModel
} from '~/models/cardModel'
import {
  cloneDeep
} from 'lodash'
import {
  columnModel
} from '../models/columnModel'
import {
  CloudinaryProvider
} from '~/providers/CloudinaryProvider'
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
    const card = await cardModel.getDetails(cardId)
    if (!card) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'card Not Found')
    }


    const rescard = cloneDeep(card) // clone card
    rescard.columns.forEach(column => {
      column.cards = rescard.cards.filter(card => {
        return card.columnId.equals(column._id)
      })
    })
    delete rescard.cards
    return rescard

  } catch (error) {
    throw error
  }
}
const updatedCard = async (cardId, reqBody, cardCoverFile, userInfor) => {
  // eslint-disable-next-line no-useless-catch
  try {
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
        commentAt : Date.now(),
        userId : userInfor._id,
        userEmail : userInfor.email
      }
      updateCard = await cardModel.unshiftComment(cardId, commentData)

    } else {
      updateCard = await cardModel.updatedCard(cardId, updateData)
    }

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