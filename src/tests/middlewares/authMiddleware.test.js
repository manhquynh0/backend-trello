import { authMiddleware } from '~/middlewares/authMiddleware'
import { JwtProvider } from '~/providers/JwtProvider'
import { mockRequest, mockResponse, mockNext } from '~/tests/helpers/mockRequestResponse'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'

jest.mock('~/providers/JwtProvider', () => ({
  JwtProvider: {
    verifyToken: jest.fn()
  }
}))

describe('authMiddleware', () => {
  let req
  let res
  let next

  beforeEach(() => {
    jest.clearAllMocks()
    res = mockResponse()
    next = mockNext()
  })

  describe('isAuthorized', () => {
    it('should return 401 when accessToken is not in cookies', async () => {
      req = mockRequest({ cookies: {} })

      await authMiddleware.isAuthorized(req, res, next)

      expect(next).toHaveBeenCalledTimes(1)
      const error = next.mock.calls[0][0]
      expect(error).toBeInstanceOf(ApiError)
      expect(error.statusCode).toBe(StatusCodes.UNAUTHORIZED)
      expect(error.message).toBe('Unauthorized !, token not found')
    })

    it('should attach jwtDecoded to req and call next when token is valid', async () => {
      const decodedUser = { _id: 'user123', email: 'user@test.com' }
      JwtProvider.verifyToken.mockResolvedValue(decodedUser)
      req = mockRequest({ cookies: { accessToken: 'valid_token' } })

      await authMiddleware.isAuthorized(req, res, next)

      expect(JwtProvider.verifyToken).toHaveBeenCalledWith('valid_token', process.env.ACCESS_SECRET_SIGNATURE)
      expect(req.jwtDecoded).toEqual(decodedUser)
      expect(next).toHaveBeenCalledWith()
    })

    it('should return 410 GONE when token is expired', async () => {
      JwtProvider.verifyToken.mockRejectedValue(new Error('jwt expired'))
      req = mockRequest({ cookies: { accessToken: 'expired_token' } })

      await authMiddleware.isAuthorized(req, res, next)

      expect(next).toHaveBeenCalledTimes(1)
      const error = next.mock.calls[0][0]
      expect(error).toBeInstanceOf(ApiError)
      expect(error.statusCode).toBe(StatusCodes.GONE)
      expect(error.message).toBe('Need to refreshToken')
    })

    it('should return 401 when token verification fails with other error', async () => {
      JwtProvider.verifyToken.mockRejectedValue(new Error('invalid signature'))
      req = mockRequest({ cookies: { accessToken: 'invalid_token' } })

      await authMiddleware.isAuthorized(req, res, next)

      expect(next).toHaveBeenCalledTimes(1)
      const error = next.mock.calls[0][0]
      expect(error).toBeInstanceOf(ApiError)
      expect(error.statusCode).toBe(StatusCodes.UNAUTHORIZED)
      expect(error.message).toBe('Unauthorized !')
    })
  })
})
