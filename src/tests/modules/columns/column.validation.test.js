import { columnValidations } from '~/validations/columnValidations'
import { mockRequest, mockResponse, mockNext } from '~/tests/helpers/mockRequestResponse'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import { ObjectId } from 'mongodb'

describe('columnValidations', () => {
  let res
  let next

  beforeEach(() => {
    res = mockResponse()
    next = mockNext()
  })

  describe('createdNew', () => {
    it('should call next when column payload is valid', async () => {
      const req = mockRequest({
        body: {
          boardId: new ObjectId().toString(),
          title: 'To Do Column'
        }
      })

      await columnValidations.createdNew(req, res, next)

      expect(next).toHaveBeenCalledWith()
    })

    it('should fail when boardId is invalid ObjectId or title is missing', async () => {
      const req = mockRequest({
        body: {
          boardId: 'not-valid-id'
        }
      })

      await columnValidations.createdNew(req, res, next)

      expect(next).toHaveBeenCalledTimes(1)
      const error = next.mock.calls[0][0]
      expect(error).toBeInstanceOf(ApiError)
      expect(error.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
    })
  })

  describe('updatedColumn', () => {
    it('should call next when updatedColumn payload is valid', async () => {
      const req = mockRequest({
        body: {
          title: 'In Progress Column',
          cardOrderIds: [new ObjectId().toString()]
        }
      })

      await columnValidations.updatedColumn(req, res, next)

      expect(next).toHaveBeenCalledWith()
    })

    it('should fail when title is too short', async () => {
      const req = mockRequest({
        body: {
          title: 'ab'
        }
      })

      await columnValidations.updatedColumn(req, res, next)

      expect(next).toHaveBeenCalledTimes(1)
      const error = next.mock.calls[0][0]
      expect(error).toBeInstanceOf(ApiError)
      expect(error.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
    })
  })
})
