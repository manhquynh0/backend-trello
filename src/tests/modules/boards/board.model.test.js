import { boardModel } from '~/models/boardModel'
import { GET_DB } from '~/config/database'
import { BOARD_TYPES } from '~/utils/constants'
import { ObjectId } from 'mongodb'

const mockInsertOne = jest.fn()
const mockFindOne = jest.fn()
const mockFindOneAndUpdate = jest.fn()
const mockDeleteOne = jest.fn()
const mockDeleteMany = jest.fn()
const mockToArray = jest.fn()
const mockAggregate = jest.fn(() => ({ toArray: mockToArray }))

const mockCollection = {
  insertOne: mockInsertOne,
  findOne: mockFindOne,
  findOneAndUpdate: mockFindOneAndUpdate,
  deleteOne: mockDeleteOne,
  deleteMany: mockDeleteMany,
  aggregate: mockAggregate
}

const mockDb = {
  collection: jest.fn(() => mockCollection)
}

jest.mock('~/config/database', () => ({
  GET_DB: jest.fn(() => mockDb)
}))

describe('boardModel', () => {
  const userId = new ObjectId().toString()
  const boardId = new ObjectId().toString()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createNew', () => {
    it('should validate schema and insert new board with ownerId', async () => {
      const insertedId = new ObjectId()
      mockInsertOne.mockResolvedValue({ insertedId })

      const result = await boardModel.createNew(userId, {
        title: 'Work Project',
        description: 'Testing board model',
        type: BOARD_TYPES.PUBLIC,
        slug: 'work-project'
      })

      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Work Project',
          ownerIds: [expect.any(ObjectId)]
        })
      )
      expect(result).toEqual({ insertedId })
    })

    it('should throw error when validation fails', async () => {
      await expect(boardModel.createNew(userId, { title: 'ab' })).rejects.toThrow()
    })
  })

  describe('findOneById', () => {
    it('should find board by id', async () => {
      const fakeBoard = { _id: new ObjectId(boardId), title: 'Work Project' }
      mockFindOne.mockResolvedValue(fakeBoard)

      const result = await boardModel.findOneById(boardId)

      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: new ObjectId(boardId) })
      expect(result).toEqual(fakeBoard)
    })
  })

  describe('getDetails', () => {
    it('should aggregate details and return first element', async () => {
      const fakeBoard = { _id: boardId, title: 'Board' }
      mockToArray.mockResolvedValue([fakeBoard])

      const result = await boardModel.getDetails(userId, boardId)

      expect(mockCollection.aggregate).toHaveBeenCalled()
      expect(result).toEqual(fakeBoard)
    })
  })

  describe('pushMemberIds and pushColumnOrderIds', () => {
    it('should push member to memberIds array', async () => {
      mockFindOneAndUpdate.mockResolvedValue({ _id: boardId })

      const result = await boardModel.pushMemberIds(boardId, userId)

      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: new ObjectId(boardId) },
        { $push: { memberIds: new ObjectId(userId) } },
        { returnDocument: 'after' }
      )
      expect(result).toBeDefined()
    })

    it('should push column to columnOrderIds array', async () => {
      const column = { _id: new ObjectId(), boardId }
      mockFindOneAndUpdate.mockResolvedValue({ _id: boardId })

      const result = await boardModel.pushColumnOrderIds(column)

      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: new ObjectId(boardId) },
        { $push: { columnOrderIds: new ObjectId(column._id) } },
        { returnDocument: 'after' }
      )
      expect(result).toBeDefined()
    })
  })

  describe('updateBoard, deleteBoard, archiveBoard, undoBoard', () => {
    it('should update board fields', async () => {
      mockFindOneAndUpdate.mockResolvedValue({ _id: boardId, title: 'New Title' })

      const result = await boardModel.updateBoard(boardId, {
        title: 'New Title',
        _id: 'should_strip',
        createdAt: 'should_strip'
      })

      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: new ObjectId(boardId) },
        { $set: { title: 'New Title' } },
        { returnDocument: 'after' }
      )
      expect(result).toBeDefined()
    })

    it('should delete board along with columns and cards', async () => {
      mockDeleteOne.mockResolvedValue({ deletedCount: 1 })
      mockDeleteMany.mockResolvedValue({ deletedCount: 3 })

      const result = await boardModel.deleteBoard(boardId)

      expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: new ObjectId(boardId) })
      expect(mockCollection.deleteMany).toHaveBeenCalledTimes(2)
      expect(result).toEqual({ deletedCount: 1 })
    })

    it('should archive and undo board', async () => {
      mockFindOneAndUpdate.mockResolvedValue({ _id: boardId, _destroy: true })

      const archiveRes = await boardModel.archiveBoard(boardId, { _destroy: true })
      expect(archiveRes).toBeDefined()

      mockFindOneAndUpdate.mockResolvedValue({ _id: boardId, _destroy: false })
      const undoRes = await boardModel.undoBoard(boardId, { _destroy: false })
      expect(undoRes).toBeDefined()
    })
  })

  describe('getBoards', () => {
    it('should run aggregation pipeline with pagination facet', async () => {
      const facetResult = [
        {
          queryBoards: [{ _id: boardId }],
          queryTotalBoards: [{ countedAllBoards: 1 }],
          queryFavoriteBoards: [{ countedFavoriteBoards: 0 }],
          queryPublicBoards: [{ countedPublicBoards: 1 }],
          queryPrivateBoards: [{ countedPrivateBoards: 0 }]
        }
      ]
      mockToArray.mockResolvedValue(facetResult)

      const result = await boardModel.getBoards(userId, 1, 10, {})

      expect(mockCollection.aggregate).toHaveBeenCalled()
      expect(result.boards).toBeDefined()
      expect(result.totalBoards).toBe(1)
    })
  })
})
