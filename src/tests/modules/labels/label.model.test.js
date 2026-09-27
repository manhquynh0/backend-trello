import { labelModel } from '~/models/labelModel'
import { GET_DB } from '~/config/database'
import { ObjectId } from 'mongodb'

const mockInsertOne = jest.fn()
const mockInsertMany = jest.fn()
const mockFindOne = jest.fn()
const mockFindOneAndUpdate = jest.fn()
const mockToArray = jest.fn()
const mockFind = jest.fn(() => ({ toArray: mockToArray }))

const mockCollection = {
  insertOne: mockInsertOne,
  insertMany: mockInsertMany,
  findOne: mockFindOne,
  findOneAndUpdate: mockFindOneAndUpdate,
  find: mockFind
}

const mockDb = {
  collection: jest.fn(() => mockCollection)
}

jest.mock('~/config/database', () => ({
  GET_DB: jest.fn(() => mockDb)
}))

describe('labelModel', () => {
  const cardId = new ObjectId().toString()
  const labelId = new ObjectId().toString()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createNew', () => {
    it('should validate and insert new label into labels collection', async () => {
      const insertedId = new ObjectId()
      mockInsertOne.mockResolvedValue({ insertedId })

      const result = await labelModel.createNew(cardId, {
        name: 'Bug Fix',
        color: '#ff0000'
      })

      expect(mockDb.collection).toHaveBeenCalledWith(labelModel.LABEL_COLLECTION_NAME)
      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          cardId: new ObjectId(cardId),
          name: 'Bug Fix',
          color: '#ff0000',
          isActive: false
        })
      )
      expect(result).toEqual({ insertedId })
    })

    it('should throw error if validation fails', async () => {
      await expect(labelModel.createNew(cardId, { name: 'ab' })).rejects.toThrow()
    })
  })

  describe('findOneById', () => {
    it('should find label by id', async () => {
      const fakeLabel = { _id: new ObjectId(labelId), name: 'Bug Fix' }
      mockFindOne.mockResolvedValue(fakeLabel)

      const result = await labelModel.findOneById(labelId)

      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: new ObjectId(labelId) })
      expect(result).toEqual(fakeLabel)
    })
  })

  describe('updateLabel', () => {
    it('should update label and return updated document', async () => {
      const updatedLabel = { _id: new ObjectId(labelId), name: 'Updated' }
      mockFindOneAndUpdate.mockResolvedValue(updatedLabel)

      const result = await labelModel.updateLabel(cardId, labelId, { name: 'Updated', isActive: true })

      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: new ObjectId(labelId), cardId: new ObjectId(cardId) },
        {
          $set: expect.objectContaining({
            name: 'Updated',
            isActive: true,
            updatedAt: expect.any(Number)
          })
        },
        { returnDocument: 'after' }
      )
      expect(result).toEqual(updatedLabel)
    })
  })

  describe('getLabels', () => {
    it('should get all labels for a card without filter', async () => {
      const fakeLabels = [{ _id: new ObjectId(labelId), name: 'Bug' }]
      mockToArray.mockResolvedValue(fakeLabels)

      const result = await labelModel.getLabels(cardId, {})

      expect(mockCollection.find).toHaveBeenCalledWith({
        cardId: new ObjectId(cardId),
        _destroy: false
      })
      expect(result).toEqual({ labels: fakeLabels })
    })

    it('should filter labels by name case-insensitively', async () => {
      mockToArray.mockResolvedValue([])

      await labelModel.getLabels(cardId, { name: 'bug' })

      expect(mockCollection.find).toHaveBeenCalledWith({
        cardId: new ObjectId(cardId),
        _destroy: false,
        name: { $regex: expect.any(RegExp) }
      })
    })
  })

  describe('deleteLabel', () => {
    it('should soft delete label by setting _destroy to true', async () => {
      mockFindOneAndUpdate.mockResolvedValue({ _id: new ObjectId(labelId), _destroy: true })

      const result = await labelModel.deleteLabel(cardId, labelId)

      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: new ObjectId(labelId), cardId: new ObjectId(cardId) },
        {
          $set: expect.objectContaining({
            _destroy: true,
            updatedAt: expect.any(Number)
          })
        },
        { returnDocument: 'after' }
      )
      expect(result).toEqual({ _id: new ObjectId(labelId), _destroy: true })
    })
  })

  describe('createDefaultLabels', () => {
    it('should insert default labels for a card', async () => {
      mockInsertMany.mockResolvedValue({ insertedCount: 8 })

      const result = await labelModel.createDefaultLabels(cardId)

      expect(mockCollection.insertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            cardId: new ObjectId(cardId),
            name: expect.any(String),
            color: expect.any(String)
          })
        ])
      )
      expect(result).toEqual({ insertedCount: 8 })
    })
  })
})
