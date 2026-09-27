import { labelService } from '~/services/labelService'
import { labelModel } from '~/models/labelModel'
import { cardModel } from '~/models/cardModel'
import { redisHelper } from '~/helpers/redisHelper'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { ObjectId } from 'mongodb'

jest.mock('~/models/labelModel', () => ({
  labelModel: {
    createNew: jest.fn(),
    findOneById: jest.fn(),
    updateLabel: jest.fn(),
    getLabels: jest.fn(),
    deleteLabel: jest.fn()
  }
}))

jest.mock('~/models/cardModel', () => ({
  cardModel: {
    getDetails: jest.fn()
  }
}))

jest.mock('~/helpers/redisHelper', () => ({
  redisHelper: {
    del: jest.fn(),
    delByPattern: jest.fn()
  }
}))

describe('labelService', () => {
  const cardId = new ObjectId().toString()
  const labelId = new ObjectId().toString()
  const boardId = new ObjectId().toString()
  const fakeCard = { _id: cardId, boardId, title: 'Test Card', labels: [] }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createNew', () => {
    it('should create label, clear cache, and return updated card', async () => {
      const insertedId = new ObjectId()
      labelModel.createNew.mockResolvedValue({ insertedId })
      cardModel.getDetails.mockResolvedValue(fakeCard)

      const result = await labelService.createNew(cardId, { name: 'Bug', color: '#ff0000' })

      expect(labelModel.createNew).toHaveBeenCalledWith(cardId, { name: 'Bug', color: '#ff0000' })
      expect(redisHelper.delByPattern).toHaveBeenCalledWith('labels:*')
      expect(redisHelper.del).toHaveBeenCalledWith('labels')
      expect(redisHelper.del).toHaveBeenCalledWith(`card:${cardId}`)
      expect(cardModel.getDetails).toHaveBeenCalledWith(cardId)
      expect(redisHelper.del).toHaveBeenCalledWith(`board:${boardId}`)
      expect(result).toEqual(fakeCard)
    })

    it('should throw BAD_REQUEST if label creation failed', async () => {
      labelModel.createNew.mockResolvedValue(null)

      await expect(labelService.createNew(cardId, { name: 'Bug', color: '#ff0000' })).rejects.toMatchObject({
        statusCode: StatusCodes.BAD_REQUEST
      })
    })
  })

  describe('updateLabel', () => {
    it('should update label, clear cache, and return updated card', async () => {
      const fakeUpdated = { _id: labelId, name: 'New Name', color: '#00ff00', isActive: true }
      labelModel.updateLabel.mockResolvedValue(fakeUpdated)
      cardModel.getDetails.mockResolvedValue(fakeCard)

      const result = await labelService.updateLabel(cardId, labelId, { name: 'New Name', color: '#00ff00', isActive: true })

      expect(labelModel.updateLabel).toHaveBeenCalledWith(cardId, labelId, { name: 'New Name', color: '#00ff00', isActive: true })
      expect(redisHelper.del).toHaveBeenCalledWith(`card:${cardId}`)
      expect(redisHelper.delByPattern).toHaveBeenCalledWith('labels:*')
      expect(cardModel.getDetails).toHaveBeenCalledWith(cardId)
      expect(redisHelper.del).toHaveBeenCalledWith(`board:${boardId}`)
      expect(result).toEqual(fakeCard)
    })

    it('should throw 404 if label not found', async () => {
      labelModel.updateLabel.mockResolvedValue(null)

      await expect(labelService.updateLabel(cardId, labelId, { name: 'New' })).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND
      })
    })
  })

  describe('getLabels', () => {
    it('should return labels from model', async () => {
      const fakeLabels = { labels: [{ name: 'Bug' }] }
      labelModel.getLabels.mockResolvedValue(fakeLabels)

      const result = await labelService.getLabels(cardId, {})

      expect(labelModel.getLabels).toHaveBeenCalledWith(cardId, {})
      expect(result).toEqual(fakeLabels)
    })
  })

  describe('deleteLabel', () => {
    it('should delete label, clear cache, and return updated card', async () => {
      labelModel.deleteLabel.mockResolvedValue({ _destroy: true })
      cardModel.getDetails.mockResolvedValue(fakeCard)

      const result = await labelService.deleteLabel(cardId, labelId)

      expect(labelModel.deleteLabel).toHaveBeenCalledWith(cardId, labelId)
      expect(redisHelper.del).toHaveBeenCalledWith(`card:${cardId}`)
      expect(redisHelper.delByPattern).toHaveBeenCalledWith('labels:*')
      expect(cardModel.getDetails).toHaveBeenCalledWith(cardId)
      expect(redisHelper.del).toHaveBeenCalledWith(`board:${boardId}`)
      expect(result).toEqual(fakeCard)
    })

    it('should throw 404 if label to delete is not found', async () => {
      labelModel.deleteLabel.mockResolvedValue(null)

      await expect(labelService.deleteLabel(cardId, labelId)).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND
      })
    })
  })
})
