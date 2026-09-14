import { invitationValidations } from '~/validations/invitationValidations'
import { mockRequest, mockResponse, mockNext } from '~/tests/helpers/mockRequestResponse'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import { ObjectId } from 'mongodb'

describe('invitationValidations', () => {
  let res
  let next

  beforeEach(() => {
    res = mockResponse()
    next = mockNext()
  })

  describe('createdNew', () => {
    it('should call next when invitation payload is valid', async () => {
      const req = mockRequest({
        body: {
          inviteeEmail: 'member@domain.com',
          boardId: new ObjectId().toString()
        }
      })

      await invitationValidations.createdNew(req, res, next)

      expect(next).toHaveBeenCalledWith()
    })

    it('should fail when inviteeEmail is missing or invalid', async () => {
      const req = mockRequest({
        body: {
          inviteeEmail: 'not-an-email',
          boardId: new ObjectId().toString()
        }
      })

      await invitationValidations.createdNew(req, res, next)

      expect(next).toHaveBeenCalledTimes(1)
      const error = next.mock.calls[0][0]
      expect(error).toBeInstanceOf(ApiError)
      expect(error.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
    })

    it('should fail when boardId is missing', async () => {
      const req = mockRequest({
        body: {
          inviteeEmail: 'member@domain.com'
        }
      })

      await invitationValidations.createdNew(req, res, next)

      expect(next).toHaveBeenCalledTimes(1)
      const error = next.mock.calls[0][0]
      expect(error).toBeInstanceOf(ApiError)
      expect(error.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
    })
  })
})
