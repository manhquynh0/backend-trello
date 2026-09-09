import { mockRequest } from '~/tests/helpers/mockRequestResponse'
import { mockResponse } from '~/tests/helpers/mockRequestResponse'
import { mockNext } from '~/tests/helpers/mockRequestResponse'
import { userController } from '~/controllers/userController'
import { userService } from '~/services/userSevice'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import ms from 'ms'
// Mock useService
jest.mock('~/services/userSevice', () => ({
  userService: {
    createNew: jest.fn(),
    verify: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
    update: jest.fn()
  }
}))


describe('User controller', () => {
  describe('createNew', () => {
    it('Should call userSevice and return response 201 when body is valid', async () => {
      const makeInput = (data = {}) => ({
        body: {
          email: 'admin@vumanhquynh.com',
          password: 'Quynh@2005',
          ...data
        }
      })
      const fakeUserResponse = {
        id: 'userId',
        email: 'admin@vumanhquynh.com',
        password: 'Quynh@2005',
        avatar: 'avatar.jpg',
        isActive: true,
        createdAt: 1234567890,
        updatedAt: 1234567890
      }
      userService.createNew.mockResolvedValue(fakeUserResponse)
      const { body } = makeInput()
      const req = mockRequest({ body })
      const res = mockResponse()
      const next = mockNext()
      await userController.createNew(req, res, next)
      expect(userService.createNew).toHaveBeenCalledWith(body)
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(fakeUserResponse)
    })
    it('Should throw error when email is exits', async () => {
      const makeInput = {
        email: 'vumanhquynh@gmail.com',
        password: 'Quynh@2004'
      }
      userService.createNew.mockRejectedValue(new ApiError(StatusCodes.CONFLICT, 'Email has been used!'))
      const { body } = makeInput
      const req = mockRequest({ body })
      const res = mockResponse()
      const next = mockNext()
      await userController.createNew(req, res, next)
      expect(next).toHaveBeenCalledWith(new ApiError(StatusCodes.CONFLICT, 'Email has been used!'))
    })
  })
  describe('verify', () => {
    it('Should call userSevice and return response 200 when body is valid', async () => {

      const fakeUserResponse = {
        id: 'userId',
        email: 'admin@vumanhquynh.com',
        isActive: true
      }
      userService.verify.mockResolvedValue(fakeUserResponse)
      const req = mockRequest({
        email: 'admin@vumanhquynh.com',
        token: 'token123'
      })
      const res = mockResponse()
      const next = mockNext()
      await userController.verify(req, res, next)
      expect(userService.verify).toHaveBeenCalledWith(req.body)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(fakeUserResponse)
    })
    it('Should throw error when verify throw error', async () => {
      userService.verify.mockRejectedValue(new ApiError(StatusCodes.CONFLICT, 'Email has been used!'))
      const req = mockRequest({
        email: 'admin@vumanhquynh.com',
        token: 'token123'
      })
      const res = mockResponse()
      const next = mockNext()
      await userController.verify(req, res, next)
      expect(next).toHaveBeenCalledWith(new ApiError(StatusCodes.CONFLICT, 'Email has been used!'))
    })
  })
  describe('login', () => {
    it('Should call userSevice and return response 200 when body is valid', async () => {
      const fakeUserResponse = {
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
        email: 'admin@vumanhquynh.com',
        _id: 'userId'
      }
      userService.login.mockResolvedValue(fakeUserResponse)
      const req = mockRequest({
        email: 'admin@vumanhquynh.com',
        password: 'Quynh@2004'
      })
      const res = mockResponse()
      const next = mockNext()
      await userController.login(req, res, next)
      expect(userService.login).toHaveBeenCalledWith(req.body)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(fakeUserResponse)
    })
    it('Should throw error when login throw error', async () => {
      userService.login.mockRejectedValue(new ApiError(StatusCodes.CONFLICT, 'Email has been used!'))
      const req = mockRequest({
        email: 'admin@vumanhquynh.com',
        password: 'Quynh@2004'
      })
      const res = mockResponse()
      const next = mockNext()
      await userController.login(req, res, next)
      expect(next).toHaveBeenCalledWith(new ApiError(StatusCodes.CONFLICT, 'Email has been used!'))
    })
  })
  describe('logout', () => {
    it('Should clear cookie ', async () => {
      const req = mockRequest()
      const res = mockResponse()
      const next = mockNext()
      await userController.logout(req, res, next)
      expect(res.clearCookie).toHaveBeenCalledWith('accessToken')
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken')
      expect(res.json).toHaveBeenCalledWith({ loggedOut: true })
    })
  })
  describe('refreshToken', () => {
    it('Should call userSevice and return response 200 when body is valid', async () => {
      const fakeUserResponse = {
        accessToken: 'NewAccessToken',
        refreshToken: 'RefreshToken',
        email: 'admin@vumanhquynh.com',
        _id: 'userId'
      }
      userService.refreshToken.mockResolvedValue(fakeUserResponse)
      const req = mockRequest({
        cookies: {
          refreshToken: 'refreshToken'
        }
      })
      const res = mockResponse()
      const next = mockNext()
      await userController.refreshToken(req, res, next)
      expect(userService.refreshToken).toHaveBeenCalledWith('refreshToken')
      expect(res.cookie).toHaveBeenCalledWith('accessToken', fakeUserResponse.accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: ms('14 days')
      })
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK)
      expect(res.json).toHaveBeenCalledWith(fakeUserResponse)
    })
    it('Should throw error when refreshToken throw error', async () => {
      userService.refreshToken.mockRejectedValue(new ApiError(StatusCodes.UNAUTHORIZED, 'Please Sign In !'))
      const req = mockRequest({
        email: 'admin@vumanhquynh.com',
        _id: 'userId'
      })
      const res = mockResponse()
      const next = mockNext()
      await userController.refreshToken(req, res, next)
      expect(next).toHaveBeenCalledWith(new ApiError(StatusCodes.UNAUTHORIZED, 'Please Sign In !'))
    })
  })
  describe('update', () => {
    it('Should call userSevice and return response 200 when body is valid', async () => {
      const fakeUserResponse = {
        email: 'client@vumanhquynh.com'
      }
      userService.update.mockResolvedValue(fakeUserResponse)
      const req = mockRequest({
        body: {
          email: 'client@vumanhquynh.com'
        },
        jwtDecoded: {
          _id: 'userId'
        }
      })
      const res = mockResponse()
      const next = mockNext()
      await userController.update(req, res, next)
      expect(userService.update).toHaveBeenCalledWith(req.jwtDecoded._id, req.body, undefined)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(fakeUserResponse)
    })
    it('Should throw error when update throw error', async () => {
      userService.update.mockRejectedValue(new ApiError(StatusCodes.CONFLICT, 'Email has been used!'))
      const req = mockRequest({
        body: {
          email: 'client@vumanhquynh.com'
        },
        jwtDecoded: {
          _id: 'userId'
        }
      })
      const res = mockResponse()
      const next = mockNext()
      await userController.update(req, res, next)
      expect(next).toHaveBeenCalledWith(new ApiError(StatusCodes.CONFLICT, 'Email has been used!'))
    })
  })


})
