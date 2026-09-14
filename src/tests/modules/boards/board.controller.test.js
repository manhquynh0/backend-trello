import { boardController } from '~/controllers/boardController'
import { boardService } from '~/services/boardService'
import { mockRequest, mockResponse, mockNext } from '~/tests/helpers/mockRequestResponse'
import { StatusCodes } from 'http-status-codes'

jest.mock('~/services/boardService', () => ({
  boardService: {
    createNew: jest.fn(),
    getDetails: jest.fn(),
    getFilteredDetails: jest.fn(),
    updateBoard: jest.fn(),
    movingCard: jest.fn(),
    getBoards: jest.fn(),
    deleteBoard: jest.fn(),
    getTrashBoards: jest.fn(),
    restoreBoard: jest.fn()
  }
}))

describe('boardController', () => {
  let req
  let res
  let next
  const userId = 'user_test_id'

  beforeEach(() => {
    jest.clearAllMocks()
    res = mockResponse()
    next = mockNext()
    req = mockRequest({
      jwtDecoded: { _id: userId }
    })
  })

  describe('createdNew', () => {
    it('should create a board and return status 201', async () => {
      const fakeBoard = { _id: 'b1', title: 'Board 1' }
      boardService.createNew.mockResolvedValue(fakeBoard)
      req.body = { title: 'Board 1' }

      await boardController.createdNew(req, res, next)

      expect(boardService.createNew).toHaveBeenCalledWith(userId, req.body)
      expect(res.status).toHaveBeenCalledWith(StatusCodes.CREATED)
      expect(res.json).toHaveBeenCalledWith(fakeBoard)
    })

    it('should catch error and call next', async () => {
      const error = new Error('Create error')
      boardService.createNew.mockRejectedValue(error)

      await boardController.createdNew(req, res, next)

      expect(next).toHaveBeenCalledWith(error)
    })
  })

  describe('getDetails', () => {
    it('should get board details and return 200', async () => {
      const fakeBoard = { _id: 'b1' }
      boardService.getDetails.mockResolvedValue(fakeBoard)
      req.params = { id: 'b1' }

      await boardController.getDetails(req, res, next)

      expect(boardService.getDetails).toHaveBeenCalledWith(userId, 'b1')
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK)
      expect(res.json).toHaveBeenCalledWith(fakeBoard)
    })

    it('should forward error to next', async () => {
      const error = new Error('Error')
      boardService.getDetails.mockRejectedValue(error)
      req.params = { id: 'b1' }

      await boardController.getDetails(req, res, next)

      expect(next).toHaveBeenCalledWith(error)
    })
  })

  describe('getFilteredDetails', () => {
    it('should get filtered details and return 200', async () => {
      const fakeBoard = { _id: 'b1' }
      boardService.getFilteredDetails.mockResolvedValue(fakeBoard)
      req.params = { id: 'b1' }
      req.query = { memberIds: 'all' }

      await boardController.getFilteredDetails(req, res, next)

      expect(boardService.getFilteredDetails).toHaveBeenCalledWith(userId, 'b1', req.query)
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK)
    })

    it('should forward error to next', async () => {
      boardService.getFilteredDetails.mockRejectedValue(new Error('err'))
      req.params = { id: 'b1' }

      await boardController.getFilteredDetails(req, res, next)

      expect(next).toHaveBeenCalled()
    })
  })

  describe('updateBoard', () => {
    it('should update board and return 200', async () => {
      const updated = { _id: 'b1' }
      boardService.updateBoard.mockResolvedValue(updated)
      req.params = { id: 'b1' }
      req.body = { title: 'New title' }
      req.file = { originalname: 'cover.png' }

      await boardController.updateBoard(req, res, next)

      expect(boardService.updateBoard).toHaveBeenCalledWith('b1', req.body, req.file)
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK)
    })

    it('should forward error to next', async () => {
      boardService.updateBoard.mockRejectedValue(new Error('err'))
      req.params = { id: 'b1' }

      await boardController.updateBoard(req, res, next)

      expect(next).toHaveBeenCalled()
    })
  })

  describe('movingCard', () => {
    it('should call movingCard service and return 200', async () => {
      const moveResult = { success: true }
      boardService.movingCard.mockResolvedValue(moveResult)
      req.body = { currentCardId: 'c1' }

      await boardController.movingCard(req, res, next)

      expect(boardService.movingCard).toHaveBeenCalledWith(req.body)
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK)
    })

    it('should forward error to next', async () => {
      boardService.movingCard.mockRejectedValue(new Error('err'))

      await boardController.movingCard(req, res, next)

      expect(next).toHaveBeenCalled()
    })
  })

  describe('getBoards', () => {
    it('should call getBoards service and return 200', async () => {
      const fakeBoards = { boards: [] }
      boardService.getBoards.mockResolvedValue(fakeBoards)
      req.query = { page: 1, itemperpage: 10, q: 'test' }

      await boardController.getBoards(req, res, next)

      expect(boardService.getBoards).toHaveBeenCalledWith(userId, 1, 10, 'test')
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK)
    })

    it('should forward error to next', async () => {
      boardService.getBoards.mockRejectedValue(new Error('err'))

      await boardController.getBoards(req, res, next)

      expect(next).toHaveBeenCalled()
    })
  })

  describe('deleteBoard', () => {
    it('should delete board and return 200', async () => {
      boardService.deleteBoard.mockResolvedValue({ deleted: true })
      req.params = { id: 'b1' }

      await boardController.deleteBoard(req, res, next)

      expect(boardService.deleteBoard).toHaveBeenCalledWith('b1')
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK)
    })

    it('should forward error to next', async () => {
      boardService.deleteBoard.mockRejectedValue(new Error('err'))
      req.params = { id: 'b1' }

      await boardController.deleteBoard(req, res, next)

      expect(next).toHaveBeenCalled()
    })
  })

  describe('archiveBoard', () => {
    it('should call archiveBoard service and return 200', async () => {
      boardService.archiveBoard = jest.fn().mockResolvedValue({ archived: true })
      req.params = { id: 'b1' }

      await boardController.archiveBoard(req, res, next)

      expect(boardService.archiveBoard).toHaveBeenCalledWith('b1')
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK)
    })

    it('should forward error to next', async () => {
      boardService.archiveBoard = jest.fn().mockRejectedValue(new Error('err'))
      req.params = { id: 'b1' }

      await boardController.archiveBoard(req, res, next)

      expect(next).toHaveBeenCalled()
    })
  })

  describe('undoBoard', () => {
    it('should restore board and return 200', async () => {
      boardService.undoBoard = jest.fn().mockResolvedValue({ restored: true })
      req.params = { id: 'b1' }

      await boardController.undoBoard(req, res, next)

      expect(boardService.undoBoard).toHaveBeenCalledWith('b1')
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK)
    })

    it('should forward error to next', async () => {
      boardService.undoBoard = jest.fn().mockRejectedValue(new Error('err'))
      req.params = { id: 'b1' }

      await boardController.undoBoard(req, res, next)

      expect(next).toHaveBeenCalled()
    })
  })
})
