import { labelValidations } from '~/validations/labelValidations'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'

const mockRequest = (overrides = {}) => ({
  params: {},
  query: {},
  body: {},
  ...overrides
})

const mockResponse = () => {
  const res = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

describe('labelValidations', () => {
  let res
  let next

  beforeEach(() => {
    res = mockResponse()
    next = jest.fn()
  })

  describe('createNew', () => {
    it('should validate single label successfully', async () => {
      const req = mockRequest({
        body: {
          name: 'Bug Fix',
          color: '#ff0000'
        }
      })

      await labelValidations.createNew(req, res, next)

      expect(next).toHaveBeenCalledWith()
    })

    it('should validate labels array successfully', async () => {
      const req = mockRequest({
        body: {
          labels: [{ name: 'Bug Fix', color: '#ff0000' }]
        }
      })

      await labelValidations.createNew(req, res, next)

      expect(next).toHaveBeenCalledWith()
    })

    it('should fail when missing color', async () => {
      const req = mockRequest({
        body: {
          name: 'Bug Fix'
        }
      })

      await labelValidations.createNew(req, res, next)

      expect(next).toHaveBeenCalledTimes(1)
      const error = next.mock.calls[0][0]
      expect(error).toBeInstanceOf(ApiError)
      expect(error.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
    })

    it('should fail when name is less than 3 chars', async () => {
      const req = mockRequest({
        body: {
          name: 'ab',
          color: '#ff0000'
        }
      })

      await labelValidations.createNew(req, res, next)

      expect(next).toHaveBeenCalledTimes(1)
      const error = next.mock.calls[0][0]
      expect(error).toBeInstanceOf(ApiError)
      expect(error.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
    })
  })

  describe('updateLabel', () => {
    it('should validate update successfully', async () => {
      const req = mockRequest({
        body: {
          name: 'Urgent Bug',
          color: '#cc0000',
          isActive: true
        }
      })

      await labelValidations.updateLabel(req, res, next)

      expect(next).toHaveBeenCalledWith()
    })

    it('should fail if name is less than 3 chars', async () => {
      const req = mockRequest({
        body: {
          name: 'x'
        }
      })

      await labelValidations.updateLabel(req, res, next)

      expect(next).toHaveBeenCalledTimes(1)
      const error = next.mock.calls[0][0]
      expect(error).toBeInstanceOf(ApiError)
      expect(error.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
    })
  })
})
