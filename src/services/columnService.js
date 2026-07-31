import {
  StatusCodes
} from 'http-status-codes'
import ApiError from '../utils/ApiError'
import slugify from '../utils/formatter'
import {
  columnModel,
  findOneById
} from '~/models/columnModel'
import {
  boardModel
} from '../models/boardModel'
import {
  cloneDeep
} from 'lodash'
import { pushColumnOrderIds} from '../models/boardModel'
const createNew = async (reqBody) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const newcolumn = {
      ...reqBody
    }
    const createdcolumn = await columnModel.createNew(newcolumn)

    const getNewcolumn = await columnModel.findOneById(createdcolumn.insertedId)
    if (getNewcolumn) {
      getNewcolumn.cards = []
      await boardModel.pushColumnOrderIds(getNewcolumn)
    }
  } catch (error) {
    throw error
  }
}
const getDetails = async (columnId) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const column = await columnModel.getDetails(columnId)
    if (!column) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'column Not Found')
    }


    const rescolumn = cloneDeep(column) // clone column
    rescolumn.columns.forEach(column => {
      column.cards = rescolumn.cards.filter(card => {
        return card.columnId.equals(column._id)
      })
    })
    delete rescolumn.cards
    return rescolumn

  } catch (error) {
    throw error
  }
}

export const columnService = {
  createNew,
  getDetails
}