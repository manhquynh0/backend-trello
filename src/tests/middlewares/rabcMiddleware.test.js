import { verifyPermission } from '~/middlewares/rabcMiddleware'
import { boardModel } from '~/models/boardModel'
import { cardModel } from '~/models/cardModel'
import { columnModel } from '~/models/columnModel'
import { roles, permission } from '~/config/rabcConfig'
import { mockRequest, mockResponse, mockNext } from '~/tests/helpers/mockRequestResponse'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import { ObjectId } from 'mongodb'

jest.mock('~/models/boardModel', () => ({
  boardModel: {
    findOneById: jest.fn()
  }
}))
jest.mock('~/models/cardModel', () => ({
  cardModel: {
    findOneById: jest.fn()
  }
}))
jest.mock('~/models/columnModel', () => ({
  columnModel: {
    findOneById: jest.fn()
  }
}))

describe('rabcMiddleware > verifyPermission', () => {
  let req
  let res
  let next
  const userId = new ObjectId().toString()
  const boardId = new ObjectId().toString()
  const columnId = new ObjectId().toString()
  const cardId = new ObjectId().toString()

  beforeEach(() => {
    jest.clearAllMocks()
    res = mockResponse()
    next = mockNext()
    req = mockRequest({
      jwtDecoded: { _id: userId }
    })
  })

  it('should return 403 when user is not owner/member of board or card', async () => {
    req.params = { boardId }
    boardModel.findOneById.mockResolvedValue({
      _id: new ObjectId(boardId),
      ownerIds: [new ObjectId()],
      memberIds: [new ObjectId()]
    })

    const middleware = verifyPermission([permission.UPDATE_BOARD])
    await middleware(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    const err = next.mock.calls[0][0]
    expect(err).toBeInstanceOf(ApiError)
    expect(err.statusCode).toBe(StatusCodes.FORBIDDEN)
    expect(err.message).toBe('Bạn không phải là thành viên của Board hoặc Thẻ này!')
  })

  it('should resolve boardId from columnId when only columnId is provided', async () => {
    req.params = { id: columnId }
    req.baseUrl = '/v1/columns'
    columnModel.findOneById.mockResolvedValue({
      _id: new ObjectId(columnId),
      boardId: new ObjectId(boardId)
    })
    boardModel.findOneById.mockResolvedValue({
      _id: new ObjectId(boardId),
      ownerIds: [new ObjectId(userId)],
      memberIds: []
    })

    const middleware = verifyPermission([permission.UPDATE_COLUMN])
    await middleware(req, res, next)

    expect(columnModel.findOneById).toHaveBeenCalledWith(columnId)
    expect(boardModel.findOneById).toHaveBeenCalledWith(boardId)
    expect(next).toHaveBeenCalledWith()
  })

  it('should resolve boardId and assign MEMBER_CARD role from cardId', async () => {
    req.params = { id: cardId }
    req.baseUrl = '/v1/cards'
    cardModel.findOneById.mockResolvedValue({
      _id: new ObjectId(cardId),
      boardId: new ObjectId(boardId),
      memberIds: [new ObjectId(userId)]
    })
    boardModel.findOneById.mockResolvedValue({
      _id: new ObjectId(boardId),
      ownerIds: [new ObjectId()],
      memberIds: []
    })

    const middleware = verifyPermission([permission.UPDATE_CARD])
    await middleware(req, res, next)

    expect(cardModel.findOneById).toHaveBeenCalledWith(cardId)
    expect(boardModel.findOneById).toHaveBeenCalledWith(boardId)
    expect(next).toHaveBeenCalledWith()
  })

  it('should allow MEMBER to join/leave card with incomingMemberInfo special branch', async () => {
    req.params = { id: boardId }
    req.baseUrl = '/v1/boards'
    req.body = { incomingMemberInfo: { userId, action: 'JOIN' } }
    boardModel.findOneById.mockResolvedValue({
      _id: new ObjectId(boardId),
      ownerIds: [new ObjectId()],
      memberIds: [new ObjectId(userId)]
    })

    const middleware = verifyPermission([permission.DELETE_BOARD]) // Requires DELETE_BOARD which member lacks
    await middleware(req, res, next)

    // Should pass through because incomingMemberInfo branch allows it
    expect(next).toHaveBeenCalledWith()
  })

  it('should return 403 when user lacks required permission', async () => {
    req.params = { boardId }
    boardModel.findOneById.mockResolvedValue({
      _id: new ObjectId(boardId),
      ownerIds: [new ObjectId()],
      memberIds: [new ObjectId(userId)]
    })

    // MEMBER does not have DELETE_BOARD permission
    const middleware = verifyPermission([permission.DELETE_BOARD])
    await middleware(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    const err = next.mock.calls[0][0]
    expect(err).toBeInstanceOf(ApiError)
    expect(err.statusCode).toBe(StatusCodes.FORBIDDEN)
    expect(err.message).toBe('Bạn không có quyền thực hiện hành động này!')
  })

  it('should return 500 when an unexpected exception occurs', async () => {
    req.params = { boardId }
    boardModel.findOneById.mockRejectedValue(new Error('Database crash'))

    const middleware = verifyPermission([])
    await middleware(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    const err = next.mock.calls[0][0]
    expect(err).toBeInstanceOf(ApiError)
    expect(err.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR)
    expect(err.message).toBe('Database crash')
  })
})
