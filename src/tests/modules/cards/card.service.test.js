import { cardService } from '~/services/cardService'
import { cardModel } from '~/models/cardModel'
import { columnModel } from '~/models/columnModel'
import { userModel } from '~/models/userModel'
import { redisHelper } from '~/helpers/redisHelper'
import { CloudinaryProvider } from '~/providers/CloudinaryProvider'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { ObjectId } from 'mongodb'

jest.mock('~/models/cardModel', () => ({
  cardModel: {
    createNew: jest.fn(),
    findOneById: jest.fn(),
    getDetails: jest.fn(),
    updatedCard: jest.fn(),
    unshiftAttachment: jest.fn(),
    unshiftComment: jest.fn(),
    updateMembers: jest.fn(),
    deleteAttachment: jest.fn(),
    createdLabel: jest.fn(),
    archivedCard: jest.fn(),
    updateLabel: jest.fn(),
    getLabels: jest.fn(),
    createdChecklist: jest.fn(),
    createdChecklistItem: jest.fn()
  }
}))

jest.mock('~/models/columnModel', () => ({
  columnModel: {
    pushCardOrderIds: jest.fn()
  }
}))

jest.mock('~/models/userModel', () => ({
  userModel: {
    findOneById: jest.fn()
  }
}))

jest.mock('~/helpers/redisHelper', () => ({
  redisHelper: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn()
  }
}))

jest.mock('~/providers/CloudinaryProvider', () => ({
  CloudinaryProvider: {
    streamUpload: jest.fn()
  }
}))

describe('cardService', () => {
  const cardId = new ObjectId().toString()
  const userId = new ObjectId().toString()
  const userInfor = { _id: userId, email: 'user@test.com' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createNew', () => {
    it('should create card with default labels, push to column, and delete board cache', async () => {
      const insertedId = new ObjectId()
      cardModel.createNew.mockResolvedValue({ insertedId })
      const fakeCard = { _id: insertedId, title: 'Card 1' }
      cardModel.findOneById.mockResolvedValue(fakeCard)
      columnModel.pushCardOrderIds.mockResolvedValue(true)

      const result = await cardService.createNew({ title: 'Card 1', boardId: 'board1' })

      expect(cardModel.createNew).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Card 1',
          labels: expect.any(Array)
        })
      )
      expect(columnModel.pushCardOrderIds).toHaveBeenCalledWith(fakeCard)
      expect(redisHelper.del).toHaveBeenCalledWith('board:board1')
      expect(result).toEqual(fakeCard)
    })
  })

  describe('getDetails', () => {
    it('should return cached card if present in Redis', async () => {
      const cached = { _id: cardId, title: 'Cached Card' }
      redisHelper.get.mockResolvedValue(cached)

      const result = await cardService.getDetails(cardId)

      expect(result).toEqual(cached)
      expect(cardModel.getDetails).not.toHaveBeenCalled()
    })

    it('should throw 404 if card not found', async () => {
      redisHelper.get.mockResolvedValue(null)
      cardModel.getDetails.mockResolvedValue(null)

      await expect(cardService.getDetails(cardId)).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND,
        message: 'Card Not Found!'
      })
    })

    it('should query DB and cache card if not in Redis', async () => {
      const card = { _id: cardId, title: 'DB Card' }
      redisHelper.get.mockResolvedValue(null)
      cardModel.getDetails.mockResolvedValue(card)

      const result = await cardService.getDetails(cardId)

      expect(redisHelper.set).toHaveBeenCalledWith(`card:${cardId}`, card)
      expect(result).toEqual(card)
    })
  })

  describe('updatedCard', () => {
    it('should update card cover when cover file is passed', async () => {
      userModel.findOneById.mockResolvedValue({ _id: userId })
      CloudinaryProvider.streamUpload.mockResolvedValue({ secure_url: 'https://cloudinary.com/cover.jpg' })
      cardModel.updatedCard.mockResolvedValue({ _id: cardId, cover: 'https://cloudinary.com/cover.jpg' })

      const coverFile = { buffer: Buffer.from('img') }
      const result = await cardService.updatedCard(cardId, {}, coverFile, null, userInfor)

      expect(CloudinaryProvider.streamUpload).toHaveBeenCalledWith(coverFile.buffer, 'card-covers')
      expect(redisHelper.del).toHaveBeenCalledWith(`card:${cardId}`)
      expect(result.cover).toBe('https://cloudinary.com/cover.jpg')
    })

    it('should upload attachment when attachment file is passed', async () => {
      userModel.findOneById.mockResolvedValue({ _id: userId, avatar: 'avt.jpg', displayName: 'User' })
      CloudinaryProvider.streamUpload.mockResolvedValue({ public_id: 'p1', secure_url: 'https://cloudinary.com/att.pdf' })
      cardModel.unshiftAttachment.mockResolvedValue({ _id: cardId })

      const attFile = { buffer: Buffer.from('doc'), mimetype: 'application/pdf', originalname: 'doc.pdf' }
      await cardService.updatedCard(cardId, {}, null, attFile, userInfor)

      expect(cardModel.unshiftAttachment).toHaveBeenCalledWith(cardId, expect.objectContaining({ publicId: 'p1' }))
      expect(redisHelper.del).toHaveBeenCalledWith(`card:${cardId}`)
    })

    it('should add comment when commentToAdd is in payload', async () => {
      userModel.findOneById.mockResolvedValue({ _id: userId })
      cardModel.unshiftComment.mockResolvedValue({ _id: cardId })

      await cardService.updatedCard(cardId, { commentToAdd: { content: 'Great job' } }, null, null, userInfor)

      expect(cardModel.unshiftComment).toHaveBeenCalledWith(
        cardId,
        expect.objectContaining({ content: 'Great job', userId, userEmail: userInfor.email })
      )
    })

    it('should update members when incomingMemberInfo is in payload', async () => {
      userModel.findOneById.mockResolvedValue({ _id: userId })
      cardModel.updateMembers.mockResolvedValue({ _id: cardId })

      await cardService.updatedCard(cardId, { incomingMemberInfo: { userId, action: 'JOIN' } }, null, null, userInfor)

      expect(cardModel.updateMembers).toHaveBeenCalledWith(cardId, { userId, action: 'JOIN' })
    })

    it('should do regular card update when no special fields are passed', async () => {
      userModel.findOneById.mockResolvedValue({ _id: userId })
      cardModel.updatedCard.mockResolvedValue({ _id: cardId, title: 'Updated' })

      await cardService.updatedCard(cardId, { title: 'Updated' }, null, null, userInfor)

      expect(cardModel.updatedCard).toHaveBeenCalledWith(cardId, expect.objectContaining({ title: 'Updated' }))
    })
  })

  describe('attachments', () => {
    it('deleteAttachment should throw 404 if attachment not found', async () => {
      cardModel.deleteAttachment.mockResolvedValue(null)
      await expect(cardService.deleteAttachment(cardId, 'att1')).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND
      })
    })

    it('deleteAttachment should delete and return result', async () => {
      cardModel.deleteAttachment.mockResolvedValue({ success: true })

      const result = await cardService.deleteAttachment(cardId, 'att1')

      expect(redisHelper.del).toHaveBeenCalledWith(`card:${cardId}`)
      expect(result).toEqual({ success: true })
    })

    it('createdAttachment should create attachment and delete cache', async () => {
      userModel.findOneById.mockResolvedValue({ _id: userId, avatar: 'a.jpg', displayName: 'U' })
      cardModel.unshiftAttachment.mockResolvedValue({ success: true })

      const reqBody = {
        attachments: [{ url: 'http://img.png', filetype: 'image/png', name: 'img.png' }]
      }
      const result = await cardService.createdAttachment(cardId, reqBody, userInfor)

      expect(cardModel.unshiftAttachment).toHaveBeenCalled()
      expect(redisHelper.del).toHaveBeenCalledWith(`card:${cardId}`)
      expect(result).toEqual({ success: true })
    })
  })

  describe('labels', () => {
    it('createdLabel should create label with ObjectId and clear cache', async () => {
      cardModel.createdLabel.mockResolvedValue({ success: true })
      const result = await cardService.createdLabel(cardId, { name: 'Bug', color: '#ff0000' })

      expect(cardModel.createdLabel).toHaveBeenCalledWith(cardId, expect.objectContaining({ name: 'Bug', _id: expect.any(String) }))
      expect(redisHelper.del).toHaveBeenCalledWith(`card:${cardId}`)
      expect(result).toEqual({ success: true })
    })

    it('updateLabel should update label fields and clear cache', async () => {
      cardModel.updateLabel.mockResolvedValue({ success: true })
      const result = await cardService.updateLabel(cardId, 'l1', { name: 'New Name', color: '#00ff00', isActive: true })

      expect(cardModel.updateLabel).toHaveBeenCalledWith(cardId, 'l1', { name: 'New Name', color: '#00ff00', isActive: true })
      expect(redisHelper.del).toHaveBeenCalledWith(`card:${cardId}`)
      expect(result).toEqual({ success: true })
    })

    it('updateLabel should throw 404 if label not found', async () => {
      cardModel.updateLabel.mockResolvedValue(null)
      await expect(cardService.updateLabel(cardId, 'l1', { name: 'New' })).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND
      })
    })

    it('getLabels should return labels from model', async () => {
      cardModel.getLabels.mockResolvedValue([{ name: 'Bug' }])
      const result = await cardService.getLabels(cardId, {})
      expect(result).toEqual([{ name: 'Bug' }])
    })
  })

  describe('archivedCard', () => {
    it('should archive card and clear cache', async () => {
      cardModel.archivedCard.mockResolvedValue({ _destroy: true })
      const result = await cardService.archivedCard(cardId)
      expect(redisHelper.del).toHaveBeenCalledWith(`card:${cardId}`)
      expect(result).toEqual({ _destroy: true })
    })

    it('should throw 404 if card not found', async () => {
      cardModel.archivedCard.mockResolvedValue(null)
      await expect(cardService.archivedCard(cardId)).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND
      })
    })
  })

  describe('checklists', () => {
    it('createdChecklist should create checklist and clear cache', async () => {
      cardModel.createdChecklist.mockResolvedValue({ success: true })
      const result = await cardService.createdChecklist(cardId, { name: 'My Checklist' })

      expect(cardModel.createdChecklist).toHaveBeenCalledWith(
        cardId,
        expect.objectContaining({ name: 'My Checklist', isSuccess: false, subItems: [] })
      )
      expect(redisHelper.del).toHaveBeenCalledWith(`card:${cardId}`)
      expect(result).toEqual({ success: true })
    })

    it('createdChecklistItem should add item and clear cache', async () => {
      cardModel.createdChecklistItem.mockResolvedValue({ success: true })
      const result = await cardService.createdChecklistItem(cardId, 'chk1', { name: 'Item 1' })

      expect(cardModel.createdChecklistItem).toHaveBeenCalledWith(
        cardId,
        'chk1',
        expect.objectContaining({ name: 'Item 1', _id: expect.any(String) })
      )
      expect(redisHelper.del).toHaveBeenCalledWith(`card:${cardId}`)
      expect(result).toEqual({ success: true })
    })

    it('createdChecklistItem should throw 404 if checklist not found', async () => {
      cardModel.createdChecklistItem.mockResolvedValue(null)
      await expect(cardService.createdChecklistItem(cardId, 'chk1', { name: 'Item 1' })).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND
      })
    })
  })
})
