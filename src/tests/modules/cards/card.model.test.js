import { cardModel } from '~/models/cardModel'
import { GET_DB } from '~/config/database'
import { ObjectId } from 'mongodb'

const mockInsertOne = jest.fn()
const mockFindOne = jest.fn()
const mockFindOneAndUpdate = jest.fn()
const mockToArray = jest.fn()
const mockAggregate = jest.fn(() => ({ toArray: mockToArray }))

const mockCollection = {
  insertOne: mockInsertOne,
  findOne: mockFindOne,
  findOneAndUpdate: mockFindOneAndUpdate,
  aggregate: mockAggregate
}

const mockDb = {
  collection: jest.fn(() => mockCollection)
}

jest.mock('~/config/database', () => ({
  GET_DB: jest.fn(() => mockDb)
}))

describe('cardModel', () => {
  const boardId = new ObjectId().toString()
  const columnId = new ObjectId().toString()
  const cardId = new ObjectId().toString()
  const userId = new ObjectId().toString()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createNew', () => {
    it('should validate and insert new card with boardId and columnId ObjectIds', async () => {
      const insertedId = new ObjectId()
      mockInsertOne.mockResolvedValue({ insertedId })

      const result = await cardModel.createNew({
        boardId,
        columnId,
        title: 'New Card'
      })

      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Card',
          boardId: expect.any(ObjectId),
          columnId: expect.any(ObjectId)
        })
      )
      expect(result).toEqual({ insertedId })
    })

    it('should throw error if validation fails', async () => {
      await expect(cardModel.createNew({ title: 'a' })).rejects.toThrow()
    })
  })

  describe('findOneById and getDetails', () => {
    it('should find card by id', async () => {
      const fakeCard = { _id: new ObjectId(cardId), title: 'Card' }
      mockFindOne.mockResolvedValue(fakeCard)

      const result = await cardModel.findOneById(cardId)

      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: new ObjectId(cardId) })
      expect(result).toEqual(fakeCard)
    })

    it('should aggregate details for card', async () => {
      const fakeCard = { _id: cardId, title: 'Card' }
      mockToArray.mockResolvedValue([fakeCard])

      const result = await cardModel.getDetails(cardId)

      expect(mockCollection.aggregate).toHaveBeenCalled()
      expect(result).toEqual(fakeCard)
    })
  })

  describe('updatedCard, unshiftComment, unshiftAttachment', () => {
    it('should update card', async () => {
      mockFindOneAndUpdate.mockResolvedValue({ _id: cardId, title: 'Updated' })

      const result = await cardModel.updatedCard(cardId, {
        title: 'Updated',
        _id: 'strip',
        boardId: 'strip',
        createdAt: 'strip'
      })

      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: new ObjectId(cardId) },
        { $set: { title: 'Updated' } },
        { returnDocument: 'after' }
      )
      expect(result).toBeDefined()
    })

    it('should unshift comment to card', async () => {
      mockFindOneAndUpdate.mockResolvedValue({ _id: cardId })

      const commentData = { content: 'Test comment' }
      await cardModel.unshiftComment(cardId, commentData)

      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: new ObjectId(cardId) },
        { $push: { comments: { $each: [commentData], $position: 0 } } },
        { returnDocument: 'after' }
      )
    })

    it('should unshift attachment to card', async () => {
      mockFindOneAndUpdate.mockResolvedValue({ _id: cardId })

      const attData = { url: 'http://att.png' }
      await cardModel.unshiftAttachment(cardId, attData)

      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: new ObjectId(cardId) },
        { $push: { attachments: { $each: [attData], $position: 0 } } },
        { returnDocument: 'after' }
      )
    })
  })

  describe('updateMembers', () => {
    it('should push member on ADD action', async () => {
      mockFindOneAndUpdate.mockResolvedValue({ _id: cardId })

      await cardModel.updateMembers(cardId, { userId, action: 'ADD' })

      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: new ObjectId(cardId) },
        { $push: { memberIds: new ObjectId(userId) } },
        { returnDocument: 'after' }
      )
    })

    it('should pull member on REMOVE action', async () => {
      mockFindOneAndUpdate.mockResolvedValue({ _id: cardId })

      await cardModel.updateMembers(cardId, { userId, action: 'REMOVE' })

      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: new ObjectId(cardId) },
        { $pull: { memberIds: new ObjectId(userId) } },
        { returnDocument: 'after' }
      )
    })
  })

  describe('attachments, labels, checklists', () => {
    it('should pull attachment on deleteAttachment', async () => {
      mockFindOneAndUpdate.mockResolvedValue({ _id: cardId })

      await cardModel.deleteAttachment(cardId, 'att_123')

      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: new ObjectId(cardId) },
        { $pull: { attachments: { publicId: 'att_123' } } },
        { returnDocument: 'after' }
      )
    })

    it('should archive card', async () => {
      mockFindOneAndUpdate.mockResolvedValue({ _id: cardId, _destroy: true })

      const res = await cardModel.archivedCard(cardId)

      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: new ObjectId(cardId) },
        { $set: { _destroy: true } },
        { returnDocument: 'after' }
      )
      expect(res).toBeDefined()
    })

    it('should push label on createdLabel', async () => {
      mockFindOneAndUpdate.mockResolvedValue({ _id: cardId })

      await cardModel.createdLabel(cardId, { name: 'Bug', color: '#ff0000' })

      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: new ObjectId(cardId) },
        { $push: { labels: expect.objectContaining({ name: 'Bug', color: '#ff0000', _id: expect.any(ObjectId) }) } },
        { returnDocument: 'after' }
      )
    })

    it('should push checklist and checklistItem', async () => {
      const checklistId = new ObjectId().toString()
      mockFindOneAndUpdate.mockResolvedValue({ _id: cardId })

      await cardModel.createdChecklist(cardId, { name: 'Tasks' })
      expect(mockCollection.findOneAndUpdate).toHaveBeenCalled()

      await cardModel.createdChecklistItem(cardId, checklistId, { name: 'Subtask' })
      expect(mockCollection.findOneAndUpdate).toHaveBeenCalled()
    })
  })
})
