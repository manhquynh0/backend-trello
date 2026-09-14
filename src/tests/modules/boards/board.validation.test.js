import { boardValidations } from '~/validations/boardValidations'
import { mockRequest, mockResponse, mockNext } from '~/tests/helpers/mockRequestResponse'
import { BOARD_TYPES } from '~/utils/constants'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import { ObjectId } from 'mongodb'

describe('boardValidations', () => {
  let res
  let next

  beforeEach(() => {
    res = mockResponse()
    next = mockNext()
  })

  describe('createdNew', () => {
    it('should call next when body is valid', async () => {
      const req = mockRequest({
        body: {
          title: 'Project Board',
          description: 'This is a description for the board',
          type: BOARD_TYPES.PUBLIC
        }
      })

      await boardValidations.createdNew(req, res, next)

      expect(next).toHaveBeenCalledWith()
    })

    it('should return UNPROCESSABLE_ENTITY when title is missing or too short', async () => {
      const req = mockRequest({
        body: {
          title: 'ab',
          description: 'Valid description',
          type: BOARD_TYPES.PUBLIC
        }
      })

      await boardValidations.createdNew(req, res, next)

      expect(next).toHaveBeenCalledTimes(1)
      const error = next.mock.calls[0][0]
      expect(error).toBeInstanceOf(ApiError)
      expect(error.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
    })
  })

  describe('updateBoard', () => {
    it('should call next when update body is valid', async () => {
      const req = mockRequest({
        body: {
          title: 'Updated Board Title',
          columnOrderIds: [new ObjectId().toString(), new ObjectId().toString()]
        }
      })

      await boardValidations.updateBoard(req, res, next)

      expect(next).toHaveBeenCalledWith()
    })

    it('should fail when title is too short or invalid type', async () => {
      const req = mockRequest({
        body: {
          title: 'ab',
          type: 'INVALID_TYPE'
        }
      })

      await boardValidations.updateBoard(req, res, next)

      expect(next).toHaveBeenCalledTimes(1)
      const error = next.mock.calls[0][0]
      expect(error).toBeInstanceOf(ApiError)
      expect(error.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
    })
  })

  describe('movingCard', () => {
    it('should call next when card movement payload is valid', async () => {
      const req = mockRequest({
        body: {
          currentCardId: new ObjectId().toString(),
          prevColumnId: new ObjectId().toString(),
          prevCardOrderIds: [new ObjectId().toString()],
          nextColumnId: new ObjectId().toString(),
          nextCardOrderIds: [new ObjectId().toString()]
        }
      })

      await boardValidations.movingCard(req, res, next)

      expect(next).toHaveBeenCalledWith()
    })

    it('should fail when missing required fields for movingCard', async () => {
      const req = mockRequest({
        body: {
          currentCardId: new ObjectId().toString()
        }
      })

      await boardValidations.movingCard(req, res, next)

      expect(next).toHaveBeenCalledTimes(1)
      const error = next.mock.calls[0][0]
      expect(error).toBeInstanceOf(ApiError)
      expect(error.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
    })
  })
})
