import {
  StatusCodes
} from 'http-status-codes'
import ApiError from '../utils/ApiError'
import slugify from '../utils/formatter'
import {
  cardModel,
  findOneById
} from '~/models/cardModel'
import {
  cloneDeep
} from 'lodash'
import {
  columnModel
} from '../models/columnModel'
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

export const cardService = {
  createNew,
  getDetails
}