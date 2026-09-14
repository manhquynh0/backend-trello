import { cardController } from '~/controllers/cardController'
import { cardService } from '~/services/cardService'
import { mockRequest, mockResponse, mockNext } from '~/tests/helpers/mockRequestResponse'
import { StatusCodes } from 'http-status-codes'

jest.mock('~/services/cardService', () => ({
  cardService: {
    createNew: jest.fn(),
    getDetails: jest.fn(),
    updatedCard: jest.fn(),
    deleteAttachment: jest.fn(),
    createdAttachment: jest.fn(),
    archivedCard: jest.fn(),
    getLabels: jest.fn(),
    createdLabel: jest.fn(),
    deletedLabel: jest.fn(),
    updateLabel: jest.fn(),
    createdChecklist: jest.fn(),
    createdChecklistItem: jest.fn()
  }
}))

describe('cardController', () => {
  let req
  let res
  let next
  const userInfor = { _id: 'user123', email: 'user@test.com' }

  beforeEach(() => {
    jest.clearAllMocks()
    res = mockResponse()
    next = mockNext()
    req = mockRequest({
      jwtDecoded: userInfor
    })
  })

  describe('createdNew', () => {
    it('should create card and return 201', async () => {
      const fakeCard = { _id: 'card1' }
      cardService.createNew.mockResolvedValue(fakeCard)
      req.body = { title: 'Card 1' }

      await cardController.createdNew(req, res, next)

      expect(cardService.createNew).toHaveBeenCalledWith(req.body)
      expect(res.status).toHaveBeenCalledWith(StatusCodes.CREATED)
      expect(res.json).toHaveBeenCalledWith(fakeCard)
    })

    it('should forward error to next', async () => {
      cardService.createNew.mockRejectedValue(new Error('err'))
      await cardController.createdNew(req, res, next)
      expect(next).toHaveBeenCalled()
    })
  })

  describe('getDetails', () => {
    it('should return card details and status 200', async () => {
      const fakeCard = { _id: 'card1' }
      cardService.getDetails.mockResolvedValue(fakeCard)
      req.params = { id: 'card1' }

      await cardController.getDetails(req, res, next)

      expect(cardService.getDetails).toHaveBeenCalledWith('card1')
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK)
      expect(res.json).toHaveBeenCalledWith(fakeCard)
    })

    it('should forward error to next', async () => {
      cardService.getDetails.mockRejectedValue(new Error('err'))
      req.params = { id: 'card1' }
      await cardController.getDetails(req, res, next)
      expect(next).toHaveBeenCalled()
    })
  })

  describe('updated', () => {
    it('should update card and return 201', async () => {
      const updatedCard = { _id: 'card1', title: 'New' }
      cardService.updatedCard.mockResolvedValue(updatedCard)
      req.params = { id: 'card1' }
      req.body = { title: 'New' }
      req.files = { cardCover: [{ filename: 'cover.jpg' }], attachments: [{ filename: 'file.pdf' }] }

      await cardController.updated(req, res, next)

      expect(cardService.updatedCard).toHaveBeenCalledWith(
        'card1',
        req.body,
        req.files.cardCover[0],
        req.files.attachments[0],
        userInfor
      )
      expect(res.status).toHaveBeenCalledWith(StatusCodes.CREATED)
      expect(res.json).toHaveBeenCalledWith(updatedCard)
    })

    it('should forward error to next', async () => {
      cardService.updatedCard.mockRejectedValue(new Error('err'))
      req.params = { id: 'card1' }
      await cardController.updated(req, res, next)
      expect(next).toHaveBeenCalled()
    })
  })

  describe('deleteAttachment', () => {
    it('should delete attachment and return 200', async () => {
      cardService.deleteAttachment.mockResolvedValue({ success: true })
      req.params = { cardId: 'c1', publicId: 'att1' }

      await cardController.deleteAttachment(req, res, next)

      expect(cardService.deleteAttachment).toHaveBeenCalledWith('c1', 'att1')
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK)
    })

    it('should forward error to next', async () => {
      cardService.deleteAttachment.mockRejectedValue(new Error('err'))
      req.params = { cardId: 'c1', publicId: 'att1' }
      await cardController.deleteAttachment(req, res, next)
      expect(next).toHaveBeenCalled()
    })
  })

  describe('createdAttachment', () => {
    it('should create attachment and return 201', async () => {
      cardService.createdAttachment.mockResolvedValue({ _id: 'c1' })
      req.params = { id: 'c1' }
      req.body = { url: 'test.png' }

      await cardController.createdAttachment(req, res, next)

      expect(cardService.createdAttachment).toHaveBeenCalledWith('c1', req.body, userInfor)
      expect(res.status).toHaveBeenCalledWith(StatusCodes.CREATED)
    })

    it('should forward error to next', async () => {
      cardService.createdAttachment.mockRejectedValue(new Error('err'))
      req.params = { id: 'c1' }
      await cardController.createdAttachment(req, res, next)
      expect(next).toHaveBeenCalled()
    })
  })

  describe('archivedCard', () => {
    it('should archive card and return 200', async () => {
      cardService.archivedCard.mockResolvedValue({ _id: 'c1', _destroy: true })
      req.params = { id: 'c1' }

      await cardController.archivedCard(req, res, next)

      expect(cardService.archivedCard).toHaveBeenCalledWith('c1')
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK)
    })

    it('should forward error to next', async () => {
      cardService.archivedCard.mockRejectedValue(new Error('err'))
      req.params = { id: 'c1' }
      await cardController.archivedCard(req, res, next)
      expect(next).toHaveBeenCalled()
    })
  })

  describe('labels and checklists', () => {
    it('should getLabels and return 200', async () => {
      cardService.getLabels.mockResolvedValue([])
      req.params = { id: 'c1' }
      req.query = { q: 'bug' }

      await cardController.getLabels(req, res, next)

      expect(cardService.getLabels).toHaveBeenCalledWith('c1', req.query)
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK)
    })

    it('should createdLabel and return 201', async () => {
      cardService.createdLabel.mockResolvedValue({ success: true })
      req.params = { id: 'c1' }
      req.body = { name: 'Bug' }

      await cardController.createdLabel(req, res, next)

      expect(cardService.createdLabel).toHaveBeenCalledWith('c1', req.body)
      expect(res.status).toHaveBeenCalledWith(StatusCodes.CREATED)
    })

    it('should deleteLabel and return 200', async () => {
      cardService.deletedLabel.mockResolvedValue({ success: true })
      req.params = { id: 'c1' }

      await cardController.deleteLabel(req, res, next)

      expect(cardService.deletedLabel).toHaveBeenCalledWith('c1')
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK)
    })

    it('should updateLabel and return 200', async () => {
      cardService.updateLabel.mockResolvedValue({ success: true })
      req.params = { id: 'c1', labelId: 'l1' }
      req.body = { name: 'New Label' }

      await cardController.updateLabel(req, res, next)

      expect(cardService.updateLabel).toHaveBeenCalledWith('c1', 'l1', req.body)
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK)
    })

    it('should createdChecklist and return 201', async () => {
      cardService.createdChecklist.mockResolvedValue({ success: true })
      req.params = { id: 'c1' }
      req.body = { name: 'Checklist' }

      await cardController.createdChecklist(req, res, next)

      expect(cardService.createdChecklist).toHaveBeenCalledWith('c1', req.body)
      expect(res.status).toHaveBeenCalledWith(StatusCodes.CREATED)
    })

    it('should createdChecklistItem and return 201', async () => {
      cardService.createdChecklistItem.mockResolvedValue({ success: true })
      req.params = { id: 'c1', checklistId: 'chk1' }
      req.body = { name: 'Item 1' }

      await cardController.createdChecklistItem(req, res, next)

      expect(cardService.createdChecklistItem).toHaveBeenCalledWith('c1', 'chk1', req.body)
      expect(res.status).toHaveBeenCalledWith(StatusCodes.CREATED)
    })

    it('should forward error to next for labels and checklists failures', async () => {
      cardService.getLabels.mockRejectedValue(new Error('err'))
      await cardController.getLabels(req, res, next)
      expect(next).toHaveBeenCalled()

      cardService.createdLabel.mockRejectedValue(new Error('err'))
      await cardController.createdLabel(req, res, next)
      expect(next).toHaveBeenCalled()

      cardService.deletedLabel.mockRejectedValue(new Error('err'))
      await cardController.deleteLabel(req, res, next)
      expect(next).toHaveBeenCalled()

      cardService.updateLabel.mockRejectedValue(new Error('err'))
      await cardController.updateLabel(req, res, next)
      expect(next).toHaveBeenCalled()

      cardService.createdChecklist.mockRejectedValue(new Error('err'))
      await cardController.createdChecklist(req, res, next)
      expect(next).toHaveBeenCalled()

      cardService.createdChecklistItem.mockRejectedValue(new Error('err'))
      await cardController.createdChecklistItem(req, res, next)
      expect(next).toHaveBeenCalled()
    })
  })
})
