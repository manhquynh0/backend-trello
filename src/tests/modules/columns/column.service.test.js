import { columnService } from '~/services/columnService'
import { columnModel } from '~/models/columnModel'
import { boardModel } from '~/models/boardModel'
import { redisHelper } from '~/helpers/redisHelper'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { ObjectId } from 'mongodb'

jest.mock('~/models/columnModel', () => ({
  columnModel: {
    createNew: jest.fn(),
    findOneById: jest.fn(),
    getDetails: jest.fn(),
    updatedColumn: jest.fn()
  }
}))

jest.mock('~/models/boardModel', () => ({
  boardModel: {
    pushColumnOrderIds: jest.fn()
  }
}))

jest.mock('~/helpers/redisHelper', () => ({
  redisHelper: {
    del: jest.fn()
  }
}))

describe('columnService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createNew', () => {
    it('should create column, push to board columnOrderIds, and clear redis cache', async () => {
      const insertedId = new ObjectId()
      const boardId = new ObjectId().toString()
      const fakeCreated = { insertedId }
      const fakeColumn = { _id: insertedId, title: 'To Do', boardId }

      columnModel.createNew.mockResolvedValue(fakeCreated)
      columnModel.findOneById.mockResolvedValue(fakeColumn)
      boardModel.pushColumnOrderIds.mockResolvedValue(true)
      redisHelper.del.mockResolvedValue(true)

      const result = await columnService.createNew({ title: 'To Do', boardId })

      expect(columnModel.createNew).toHaveBeenCalledWith({ title: 'To Do', boardId })
      expect(columnModel.findOneById).toHaveBeenCalledWith(insertedId)
      expect(boardModel.pushColumnOrderIds).toHaveBeenCalledWith(fakeColumn)
      expect(redisHelper.del).toHaveBeenCalledWith(`board:${boardId}`)
      expect(result).toEqual({ ...fakeColumn, cards: [] })
    })

    it('should throw error if creation fails', async () => {
      columnModel.createNew.mockRejectedValue(new Error('DB error'))
      await expect(columnService.createNew({ title: 'To Do' })).rejects.toThrow('DB error')
    })
  })

  describe('getDetails', () => {
    it('should throw 404 if column is not found', async () => {
      columnModel.getDetails.mockResolvedValue(null)

      await expect(columnService.getDetails('col1')).rejects.toThrow(ApiError)
      await expect(columnService.getDetails('col1')).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND,
        message: 'column Not Found'
      })
    })

    it('should clone and map cards into column successfully', async () => {
      const colId = new ObjectId()
      const fakeDetails = {
        _id: colId,
        columns: [{ _id: colId, cards: [] }],
        cards: [{ _id: 'card1', columnId: colId }]
      }
      columnModel.getDetails.mockResolvedValue(fakeDetails)

      const result = await columnService.getDetails(colId.toString())

      expect(result.columns[0].cards).toHaveLength(1)
      expect(result.cards).toBeUndefined()
    })
  })

  describe('updatedColumn', () => {
    it('should update column with updatedAt timestamp', async () => {
      const updateResult = { modifiedCount: 1 }
      columnModel.updatedColumn.mockResolvedValue(updateResult)

      const result = await columnService.updatedColumn('col1', { title: 'New Title' })

      expect(columnModel.updatedColumn).toHaveBeenCalledWith(
        'col1',
        expect.objectContaining({ title: 'New Title', updatedAt: expect.any(Number) })
      )
      expect(result).toEqual(updateResult)
    })
  })

  describe('deletedColumn', () => {
    it('should soft delete column with _destroy: true', async () => {
      const updateResult = { modifiedCount: 1 }
      columnModel.updatedColumn.mockResolvedValue(updateResult)

      const result = await columnService.deletedColumn('col1')

      expect(columnModel.updatedColumn).toHaveBeenCalledWith('col1', { _destroy: true })
      expect(result).toEqual(updateResult)
    })
  })
})
