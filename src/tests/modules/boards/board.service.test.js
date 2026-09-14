import { boardService } from '~/services/boardService'
import { boardModel } from '~/models/boardModel'
import { columnModel } from '~/models/columnModel'
import { cardModel } from '~/models/cardModel'
import { redisHelper } from '~/helpers/redisHelper'
import { CloudinaryProvider } from '~/providers/CloudinaryProvider'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { ObjectId } from 'mongodb'

jest.mock('~/models/boardModel', () => ({
  boardModel: {
    createNew: jest.fn(),
    findOneById: jest.fn(),
    getDetails: jest.fn(),
    updateBoard: jest.fn(),
    getBoards: jest.fn(),
    deleteBoard: jest.fn(),
    archiveBoard: jest.fn(),
    undoBoard: jest.fn()
  }
}))

jest.mock('~/models/columnModel', () => ({
  columnModel: {
    updatedColumn: jest.fn()
  }
}))

jest.mock('~/models/cardModel', () => ({
  cardModel: {
    updatedCard: jest.fn()
  }
}))

jest.mock('~/helpers/redisHelper', () => ({
  redisHelper: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    delByPattern: jest.fn()
  }
}))

jest.mock('~/providers/CloudinaryProvider', () => ({
  CloudinaryProvider: {
    streamUpload: jest.fn()
  }
}))

describe('boardService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('createNew', () => {
    it('should create board with slug and clear cache', async () => {
      const insertedId = new ObjectId()
      boardModel.createNew.mockResolvedValue({ insertedId })
      const fakeBoard = { _id: insertedId, title: 'My New Board', slug: 'my-new-board' }
      boardModel.findOneById.mockResolvedValue(fakeBoard)

      const result = await boardService.createNew('user1', { title: 'My New Board' })

      expect(boardModel.createNew).toHaveBeenCalledWith('user1', expect.objectContaining({ slug: 'my-new-board' }))
      expect(redisHelper.delByPattern).toHaveBeenCalledWith('boards:*')
      expect(redisHelper.del).toHaveBeenCalledWith('boards')
      expect(result).toEqual(fakeBoard)
    })
  })

  describe('getDetails', () => {
    const boardId = new ObjectId().toString()

    it('should return cached board if present in Redis', async () => {
      const cached = { _id: boardId, title: 'Cached Board' }
      redisHelper.get.mockResolvedValue(cached)

      const result = await boardService.getDetails('user1', boardId)

      expect(redisHelper.get).toHaveBeenCalledWith(`board:${boardId}`)
      expect(result).toEqual(cached)
      expect(boardModel.getDetails).not.toHaveBeenCalled()
    })

    it('should throw 404 if board not found in DB', async () => {
      redisHelper.get.mockResolvedValue(null)
      boardModel.getDetails.mockResolvedValue(null)

      await expect(boardService.getDetails('user1', boardId)).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND,
        message: 'Board Not Found'
      })
    })

    it('should map cards to columns and cache board in Redis', async () => {
      const colId = new ObjectId()
      const rawBoard = {
        _id: new ObjectId(boardId),
        columns: [{ _id: colId }],
        cards: [{ _id: 'card1', columnId: colId }]
      }
      redisHelper.get.mockResolvedValue(null)
      boardModel.getDetails.mockResolvedValue(rawBoard)

      const result = await boardService.getDetails('user1', boardId)

      expect(result.columns[0].cards).toHaveLength(1)
      expect(result.cards).toBeUndefined()
      expect(redisHelper.set).toHaveBeenCalledWith(`board:${boardId}`, expect.any(Object))
    })
  })

  describe('updateBoard', () => {
    const boardId = new ObjectId().toString()

    it('should upload cover to Cloudinary if file is provided', async () => {
      CloudinaryProvider.streamUpload.mockResolvedValue({ secure_url: 'https://cloudinary.com/cover.jpg' })
      boardModel.updateBoard.mockResolvedValue({ _id: boardId, cover: 'https://cloudinary.com/cover.jpg' })

      const file = { buffer: Buffer.from('test') }
      await boardService.updateBoard(boardId, { title: 'Updated' }, file)

      expect(CloudinaryProvider.streamUpload).toHaveBeenCalledWith(file.buffer, 'board-covers')
      expect(boardModel.updateBoard).toHaveBeenCalledWith(boardId, { cover: 'https://cloudinary.com/cover.jpg' })
      expect(redisHelper.delByPattern).toHaveBeenCalledWith('boards:*')
    })

    it('should update board without file', async () => {
      boardModel.updateBoard.mockResolvedValue({ _id: boardId, title: 'Updated' })

      const result = await boardService.updateBoard(boardId, { title: 'Updated' })

      expect(CloudinaryProvider.streamUpload).not.toHaveBeenCalled()
      expect(boardModel.updateBoard).toHaveBeenCalledWith(boardId, expect.objectContaining({ title: 'Updated' }))
      expect(result).toBeDefined()
    })
  })

  describe('movingCard', () => {
    const boardId = 'board1'

    it('should store drag data in Redis and trigger debounce sync to MongoDB', async () => {
      const reqBody = {
        boardId,
        currentCardId: 'c1',
        prevColumnId: 'col1',
        prevCardOrderIds: ['c2'],
        nextColumnId: 'col2',
        nextCardOrderIds: ['c1', 'c3']
      }

      redisHelper.get.mockResolvedValue(reqBody)
      columnModel.updatedColumn.mockResolvedValue({})
      cardModel.updatedCard.mockResolvedValue({})

      const result = await boardService.movingCard(reqBody)

      expect(redisHelper.set).toHaveBeenCalledWith(`drag:${boardId}`, reqBody, 60)
      expect(redisHelper.del).toHaveBeenCalledWith(`board:${boardId}`)
      expect(result).toEqual({ updateResult: 'Successfully' })

      // Advance timers to trigger debounce setTimeout
      jest.advanceTimersByTime(600)
    })
  })

  describe('getFilteredDetails', () => {
    const boardId = new ObjectId().toString()
    const colId = new ObjectId()
    const memberId = new ObjectId().toString()
    const labelId = new ObjectId().toString()

    it('should filter cards by search, memberId, labelId, dueDate, checklist, attachments', async () => {
      const today = new Date()
      const rawBoard = {
        _id: new ObjectId(boardId),
        columns: [{ _id: colId, cardOrderIds: ['card1', 'card2', 'card3'] }],
        cards: [
          {
            _id: 'card1',
            columnId: colId,
            title: 'Bug login',
            description: 'Fix OAuth',
            memberIds: [new ObjectId(memberId)],
            labels: [{ _id: new ObjectId(labelId), isActive: true }],
            dueDate: today.toISOString(),
            checkList: [{ subItems: [{ isSuccess: true }] }],
            attachments: [{ url: 'test.jpg' }]
          },
          {
            _id: 'card2',
            columnId: colId,
            title: 'Feature payment',
            description: 'Stripe',
            memberIds: [],
            labels: [],
            checkList: []
          }
        ]
      }

      redisHelper.get.mockResolvedValue(null)
      boardModel.getDetails.mockResolvedValue(rawBoard)

      const filters = {
        search: 'login',
        memberId,
        labelId,
        dueDate: 'today',
        checklist: 'completed',
        attachments: 'with'
      }

      const result = await boardService.getFilteredDetails('user1', boardId, filters)

      expect(result.columns[0].cards).toHaveLength(1)
      expect(result.columns[0].cards[0]._id).toBe('card1')
    })
  })

  describe('getBoards', () => {
    it('should return cached boards if available', async () => {
      redisHelper.get.mockResolvedValue({ boards: [{ _id: 'b1' }] })

      const result = await boardService.getBoards('user1', 1, 10, {})

      expect(result.boards).toHaveLength(1)
      expect(boardModel.getBoards).not.toHaveBeenCalled()
    })

    it('should query DB and cache when not in Redis', async () => {
      redisHelper.get.mockResolvedValue(null)
      boardModel.getBoards.mockResolvedValue({ boards: [{ _id: 'b1' }] })

      const result = await boardService.getBoards('user1')

      expect(boardModel.getBoards).toHaveBeenCalledWith('user1', 1, 10, undefined)
      expect(redisHelper.set).toHaveBeenCalled()
      expect(result.boards).toHaveLength(1)
    })
  })

  describe('deleteBoard, archiveBoard, undoBoard', () => {
    const boardId = new ObjectId().toString()

    it('deleteBoard should throw 404 if not found', async () => {
      boardModel.findOneById.mockResolvedValue(null)
      await expect(boardService.deleteBoard(boardId)).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND
      })
    })

    it('deleteBoard should delete board and clear cache', async () => {
      boardModel.findOneById.mockResolvedValue({ _id: boardId })
      boardModel.deleteBoard.mockResolvedValue({ deleted: true })

      const result = await boardService.deleteBoard(boardId)

      expect(boardModel.deleteBoard).toHaveBeenCalledWith(boardId)
      expect(redisHelper.delByPattern).toHaveBeenCalledWith('boards:*')
      expect(result).toEqual({ deleted: true })
    })

    it('archiveBoard should archive and clear cache', async () => {
      boardModel.findOneById.mockResolvedValue({ _id: boardId })
      boardModel.archiveBoard.mockResolvedValue({ archived: true })

      const result = await boardService.archiveBoard(boardId)

      expect(boardModel.archiveBoard).toHaveBeenCalledWith(boardId, expect.objectContaining({ _destroy: true }))
      expect(redisHelper.delByPattern).toHaveBeenCalledWith('boards:*')
      expect(result).toEqual({ archived: true })
    })

    it('archiveBoard should throw 404 if not found', async () => {
      boardModel.findOneById.mockResolvedValue(null)
      await expect(boardService.archiveBoard(boardId)).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND
      })
    })

    it('undoBoard should undo archive and clear cache', async () => {
      boardModel.findOneById.mockResolvedValue({ _id: boardId })
      boardModel.undoBoard.mockResolvedValue({ restored: true })

      const result = await boardService.undoBoard(boardId)

      expect(boardModel.undoBoard).toHaveBeenCalledWith(boardId, expect.objectContaining({ _destroy: false }))
      expect(redisHelper.delByPattern).toHaveBeenCalledWith('boards:*')
      expect(result).toEqual({ restored: true })
    })

    it('undoBoard should throw 404 if not found', async () => {
      boardModel.findOneById.mockResolvedValue(null)
      await expect(boardService.undoBoard(boardId)).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND
      })
    })
  })
})
