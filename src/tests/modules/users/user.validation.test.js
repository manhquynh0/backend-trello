import { mockRequest, mockResponse, mockNext } from '../../helpers/mockRequestResponse'
import { userValidation } from '~/validations/userValidation'
import StatusCodes from 'http-status-codes'
import ApiError from '~/utils/ApiError'

describe('User validation > Joi Schema', () => {
  let res
  let next

  beforeEach(() => {
    res = mockResponse()
    next = mockNext()
  })

  describe('createNew', () => {
    const makeInput = (data = {}) => ({
      body: {
        email: 'admin@vumanhquynh.com',
        password: 'Quynh@2005',
        ...data
      }
    })

    it('Should call next validation when body is valid', async () => {
      const { body } = makeInput()
      const req = mockRequest({ body })
      await userValidation.createNew(req, res, next)
      expect(next).toHaveBeenCalledWith()
    })

    test.each([
      { data: { email: undefined }, caseName: 'thiếu email' },
      { data: { password: undefined }, caseName: 'thiếu password' },
      { data: { email: 'invalid-email' }, caseName: 'email sai định dạng' },
      { data: { password: '123' }, caseName: 'password sai định dạng' }
    ])('Should fail validation when $caseName', async ({ data }) => {
      const { body } = makeInput(data)
      const req = mockRequest({ body })

      await userValidation.createNew(req, res, next)

      expect(next).toHaveBeenCalledTimes(1)
      const errorArg = next.mock.calls[0][0]
      expect(errorArg).toBeInstanceOf(ApiError)
      expect(errorArg.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
    })
  })

  describe('verify', () => {
    it('Should call next when email and token are valid', async () => {
      const req = mockRequest({
        body: {
          email: 'valid@example.com',
          token: 'some-verification-token'
        }
      })
      await userValidation.verify(req, res, next)
      expect(next).toHaveBeenCalledWith()
    })

    it('Should fail when missing token or invalid email', async () => {
      const req = mockRequest({
        body: {
          email: 'bad-email'
        }
      })
      await userValidation.verify(req, res, next)
      expect(next).toHaveBeenCalledTimes(1)
      const errorArg = next.mock.calls[0][0]
      expect(errorArg).toBeInstanceOf(ApiError)
      expect(errorArg.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
    })
  })

  describe('login', () => {
    it('Should call next when login body is valid', async () => {
      const req = mockRequest({
        body: {
          email: 'valid@example.com',
          password: 'Password@123'
        }
      })
      await userValidation.login(req, res, next)
      expect(next).toHaveBeenCalledWith()
    })

    it('Should fail when password does not match regex', async () => {
      const req = mockRequest({
        body: {
          email: 'valid@example.com',
          password: '123'
        }
      })
      await userValidation.login(req, res, next)
      expect(next).toHaveBeenCalledTimes(1)
      const errorArg = next.mock.calls[0][0]
      expect(errorArg).toBeInstanceOf(ApiError)
      expect(errorArg.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
    })
  })

  describe('update', () => {
    it('Should call next when update body is valid', async () => {
      const req = mockRequest({
        body: {
          displayName: 'New Name',
          password: 'OldPassword@123',
          newPassword: 'NewPassword@123'
        }
      })
      await userValidation.update(req, res, next)
      expect(next).toHaveBeenCalledWith()
    })

    it('Should fail when newPassword does not match pattern', async () => {
      const req = mockRequest({
        body: {
          newPassword: 'short'
        }
      })
      await userValidation.update(req, res, next)
      expect(next).toHaveBeenCalledTimes(1)
      const errorArg = next.mock.calls[0][0]
      expect(errorArg).toBeInstanceOf(ApiError)
      expect(errorArg.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
    })
  })
})