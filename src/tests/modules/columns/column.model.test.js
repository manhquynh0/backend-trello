import { columnModel } from '~/models/columnModel'
import { GET_DB } from '~/config/database'
import { ObjectId } from 'mongodb'

const mockInsertOne = jest.fn()
const mockFindOne = jest.fn()
const mockFindOneAndUpdate = jest.fn()

const mockCollection = {
  insertOne: mockInsertOne,
  findOne: mockFindOne,
  findOneAndUpdate: mockFindOneAndUpdate
}

const mockDb = {
  collection: jest.fn(() => mockCollection)
}

jest.mock('~/config/database', () => ({
  GET_DB: jest.fn(() => mockDb)
}))

describe('columnModel', () => {
  const boardId = new ObjectId().toString()
  const columnId = new ObjectId().toString()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createNew', () => {
    it('should validate and insert column', async () => {
      const insertedId = new ObjectId()
      mockInsertOne.mockResolvedValue({ insertedId })

      const result = await columnModel.createNew({
        boardId,
        title: 'Sprint Backlog'
      })

      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Sprint Backlog',
          boardId: expect.any(ObjectId)
        })
      )
      expect(result).toEqual({ insertedId })
    })

    it('should throw error if validation or insert fails', async () => {
      await expect(columnModel.createNew({ boardId: 'invalid-id' })).rejects.toThrow()
    })
  })

  describe('findOneById', () => {
    it('should find column by id', async () => {
      const fakeColumn = { _id: new ObjectId(columnId), title: 'Col' }
      mockFindOne.mockResolvedValue(fakeColumn)

      const result = await columnModel.findOneById(columnId)

      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: new ObjectId(columnId) })
      expect(result).toEqual(fakeColumn)
    })
  })

  describe('pushCardOrderIds', () => {
    it('should push card id to column cardOrderIds', async () => {
      const card = { _id: new ObjectId(), columnId }
      mockFindOneAndUpdate.mockResolvedValue({ _id: columnId })

      const result = await columnModel.pushCardOrderIds(card)

      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: new ObjectId(columnId) },
        { $push: { cardOrderIds: new ObjectId(card._id) } },
        { ReturnDocument: 'after' }
      )
      expect(result).toBeDefined()
    })
  })

  describe('updatedColumn and deletedColumn', () => {
    it('should update column filtering invalid fields', async () => {
      mockFindOneAndUpdate.mockResolvedValue({ _id: columnId, title: 'Updated' })

      const result = await columnModel.updatedColumn(columnId, {
        title: 'Updated',
        boardId: 'should_be_stripped',
        createdAt: 'should_be_stripped'
      })

      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: new ObjectId(columnId) },
        { $set: { title: 'Updated' } },
        { returnDocument: 'after' }
      )
      expect(result).toBeDefined()
    })

    it('should soft delete column with _destroy: true', async () => {
      mockFindOneAndUpdate.mockResolvedValue({ _id: columnId, _destroy: true })

      const result = await columnModel.deletedColumn(columnId)

      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: new ObjectId(columnId) },
        { $set: { _destroy: true } },
        { returnDocument: 'after' }
      )
      expect(result).toBeDefined()
    })
  })
})
