import { userModel } from '~/models/userModel'
import bcryptjs from 'bcryptjs'
import { userService } from '~/services/userSevice'
import { v4 as uuidv4 } from 'uuid'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import { BrevoProvider } from '~/providers/BrevoProvider'
import { JwtProvider } from '~/providers/JwtProvider'
import { CloudinaryProvider } from '~/providers/CloudinaryProvider'
jest.mock('~/models/userModel', () => {
  return {
    userModel: {
      createNew: jest.fn(),
      findOneByEmail: jest.fn(),
      findOneById: jest.fn(),
      verify: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
      update: jest.fn()
    }
  }
})
jest.mock('bcryptjs', () => {
  return {
    hashSync: jest.fn(),
    compare: jest.fn()
  }
})
jest.mock('uuid', () => ({
  v4: jest.fn()
}))
jest.mock('~/providers/BrevoProvider', () => ({
  BrevoProvider: {
    sendEmail: jest.fn()
  }
}))
jest.mock('~/providers/JwtProvider', () => ({
  JwtProvider: {
    generateToken: jest.fn(),
    verifyToken: jest.fn()
  }
}))

jest.mock('~/providers/CloudinaryProvider', () => ({
  CloudinaryProvider: {
    streamUpload: jest.fn()
  }
}))
describe('User service', () => {
  describe('createNew', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })
    it('Should create a new user', async () => {
      const hashPassword = 'hashPassword'
      bcryptjs.hashSync.mockReturnValue(hashPassword)
      const verifyToken = '123'
      uuidv4.mockReturnValue(verifyToken)
      const fakeUser = {
        _id: 'userId',
        email: 'test@gmail.com',
        password: hashPassword,
        userName: 'test',
        displayName: 'test',
        verifyToken: verifyToken
      }
      userModel.createNew.mockResolvedValue({ insertedId: 'userId' })
      userModel.findOneById.mockResolvedValue(fakeUser)
      userModel.findOneByEmail.mockResolvedValue(null)
      BrevoProvider.sendEmail.mockResolvedValue(true)

      const result = await userService.createNew({
        email: 'test@gmail.com',
        password: 'password',
        userName: 'test'
      })
      expect(userModel.findOneByEmail).toHaveBeenCalledWith(fakeUser.email)
      expect(userModel.findOneByEmail).toHaveBeenCalledTimes(1)
      expect(userModel.createNew).toHaveBeenCalledWith({
        email: 'test@gmail.com',
        password: hashPassword,
        userName: 'test',
        displayName: 'test',
        verifyToken: verifyToken
      })
      expect(userModel.findOneById).toHaveBeenCalledWith('userId')
      expect(BrevoProvider.sendEmail).toHaveBeenCalledTimes(1)
      expect(bcryptjs.hashSync).toHaveBeenCalledWith('password', 8)
      expect(uuidv4).toHaveBeenCalledWith()
      expect(result).toEqual({
        _id: 'userId',
        email: 'test@gmail.com',
        userName: 'test',
        displayName: 'test'
      })
    })

    it('should return conflict when user email is exits', async () => {
      userModel.findOneByEmail.mockResolvedValue({
        _id: 'userId',
        email: 'test@gmail.com',
        password: 'hashPassword',
        userName: 'test',
        displayName: 'test',
        verifyToken: '123'
      })
      const result = userService.createNew({
        email: 'test@gmail.com',
        password: 'password',
        userName: 'test'
      })
      await expect(result).rejects.toMatchObject({
        statusCode: StatusCodes.CONFLICT,
        message: 'Email đã tồn tại !'
      })
      expect(userModel.findOneByEmail).toHaveBeenCalledWith('test@gmail.com')
      expect(userModel.findOneByEmail).toHaveBeenCalledTimes(1)
      expect(bcryptjs.hashSync).not.toHaveBeenCalled()
      expect(userModel.createNew).not.toHaveBeenCalled()
      expect(uuidv4).not.toHaveBeenCalled()
    })
  })
  describe('verify', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })
    it('Should verify a user', async () => {
      const fakeUser = {
        _id: 'userId',
        email: 'test@gmail.com',
        password: 'hashPassword',
        userName: 'test',
        displayName: 'test',
        verifyToken: '123'
      }
      userModel.findOneByEmail.mockResolvedValue(fakeUser)
      userModel.update.mockResolvedValue({
        ...fakeUser,
        isActive: true,
        verifyToken: null
      })
      const result = await userService.verify({
        email: 'test@gmail.com',
        token: '123'
      })
      expect(userModel.findOneByEmail).toHaveBeenCalledWith('test@gmail.com')
      expect(userModel.findOneByEmail).toHaveBeenCalledTimes(1)
      expect(userModel.update).toHaveBeenCalledWith('userId', {
        isActive: true,
        verifyToken: null
      })
      expect(result).toEqual({
        _id: 'userId',
        email: 'test@gmail.com',
        userName: 'test',
        displayName: 'test'
      })
    })
    it('Should return status Not Found when user is not exits', async () => {
      userModel.findOneByEmail.mockResolvedValue(null)
      const result = userService.verify({
        email: 'test@gmail.com',
        token: '123'
      })
      await expect(result).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND,
        message: 'Không tìm thấy tài khoản!'
      })
      expect(userModel.findOneByEmail).toHaveBeenCalledWith('test@gmail.com')
      expect(userModel.update).not.toHaveBeenCalled()
      expect(userModel.findOneByEmail).toHaveBeenCalledTimes(1)
    })
    it('Should return status Not Acceptable when user is already active', async () => {
      userModel.findOneByEmail.mockResolvedValue({
        _id: 'userId',
        email: 'test@gmail.com',
        password: 'hashPassword',
        userName: 'test',
        displayName: 'test',
        verifyToken: '123',
        isActive: true
      })
      const result = userService.verify({
        email: 'test@gmail.com',
        token: '123'
      })
      await expect(result).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_ACCEPTED,
        message: 'Tài khoản đã được kích hoạt !'
      })
      expect(userModel.findOneByEmail).toHaveBeenCalledWith('test@gmail.com')
      expect(userModel.update).not.toHaveBeenCalled()
      expect(userModel.findOneByEmail).toHaveBeenCalledTimes(1)
    })
    it('Should return status Not Acceptable when token is not valid', async () => {
      userModel.findOneByEmail.mockResolvedValue({
        _id: 'userId',
        email: 'test@gmail.com',
        password: 'hashPassword',
        userName: 'test',
        displayName: 'test',
        verifyToken: '123'
      })
      const result = userService.verify({
        email: 'test@gmail.com',
        token: '1234'
      })
      await expect(result).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_ACCEPTED,
        message: 'Token không hợp lệ!'
      })
      expect(userModel.findOneByEmail).toHaveBeenCalledWith('test@gmail.com')
      expect(userModel.update).not.toHaveBeenCalled()
      expect(userModel.findOneByEmail).toHaveBeenCalledTimes(1)
    })
  })

  describe('login', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })
    it('Should login a user', async () => {
      const fakeUser = {
        _id: 'userId',
        email: 'test@gmail.com',
        password: 'hashPassword',
        userName: 'test',
        displayName: 'test',
        verifyToken: '123',
        isActive: true
      }
      userModel.findOneByEmail.mockResolvedValue(fakeUser)
      bcryptjs.compare.mockReturnValue(true)
      const accessToken = 'accessToken'
      const refreshToken = 'refreshToken'
      JwtProvider.generateToken.mockReturnValue(accessToken)
      JwtProvider.generateToken.mockReturnValue(refreshToken)
      const result = await userService.login({
        email: 'test@gmail.com',
        password: 'password'
      })
      expect(JwtProvider.generateToken).toHaveBeenCalledWith({
        email: fakeUser.email,
        _id: fakeUser._id
      }, process.env.ACCESS_SECRET_SIGNATURE, process.env.ACCESS_TOKEN_LIFE)
      expect(JwtProvider.generateToken).toHaveBeenCalledWith({
        email: fakeUser.email,
        _id: fakeUser._id
      }, process.env.REFRESH_SECRET_SIGNATURE, process.env.REFRESH_TOKEN_LIFE)
      expect(JwtProvider.generateToken).toHaveBeenCalledTimes(2)
      expect(userModel.findOneByEmail).toHaveBeenCalledWith('test@gmail.com')
      expect(userModel.findOneByEmail).toHaveBeenCalledTimes(1)
      expect(bcryptjs.compare).toHaveBeenCalledWith('password', 'hashPassword')
      expect(result).toMatchObject({
        _id: 'userId',
        email: 'test@gmail.com',
        userName: 'test',
        displayName: 'test'
      })
      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
    })
    it('Should return status Not Found when user is not exits', async () => {
      userModel.findOneByEmail.mockResolvedValue(null)
      const result = userService.login({
        email: 'test@gmail.com',
        password: 'password'
      })
      await expect(result).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND,
        message: 'Không tìm thấy tài khoản!'
      })
      expect(userModel.findOneByEmail).toHaveBeenCalledWith('test@gmail.com')
      expect(userModel.findOneByEmail).toHaveBeenCalledTimes(1)
      expect(bcryptjs.compare).not.toHaveBeenCalled()
      expect(JwtProvider.generateToken).not.toHaveBeenCalled()
    })
    it('Should return status Not Acceptable when user is not active', async () => {
      userModel.findOneByEmail.mockResolvedValue({
        _id: 'userId',
        email: 'test@gmail.com',
        password: 'hashPassword',
        userName: 'test',
        displayName: 'test',
        verifyToken: '123',
        isActive: false
      })
      const result = userService.login({
        email: 'test@gmail.com',
        password: 'password'
      })
      await expect(result).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_ACCEPTED,
        message: 'Tài khoản chưa được kích hoạt'
      })
      expect(userModel.findOneByEmail).toHaveBeenCalledWith('test@gmail.com')
      expect(userModel.findOneByEmail).toHaveBeenCalledTimes(1)
      expect(bcryptjs.compare).not.toHaveBeenCalled()
      expect(JwtProvider.generateToken).not.toHaveBeenCalled()
    })
    it('Should return status Not Acceptable when password is not correct', async () => {
      userModel.findOneByEmail.mockResolvedValue({
        _id: 'userId',
        email: 'test@gmail.com',
        password: 'hashPassword',
        userName: 'test',
        displayName: 'test',
        verifyToken: '123',
        isActive: true
      })
      bcryptjs.compare.mockResolvedValue(false)
      const result = userService.login({
        email: 'test@gmail.com',
        password: 'password'
      })
      await expect(result).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_ACCEPTABLE,
        message: 'Email hoặc mật khẩu không đúng!'
      })
      expect(userModel.findOneByEmail).toHaveBeenCalledWith('test@gmail.com')
      expect(userModel.findOneByEmail).toHaveBeenCalledTimes(1)
      expect(bcryptjs.compare).toHaveBeenCalledWith('password', 'hashPassword')
      expect(JwtProvider.generateToken).not.toHaveBeenCalled()
    })
  })
  describe('refreshToken', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })
    it('Should return access token', async () => {
      const user = {
        email: 'test@gmail.com',
        _id: 'userId'
      }
      const accessToken = 'accessToken'
      JwtProvider.generateToken.mockReturnValue(accessToken)
      JwtProvider.verifyToken.mockReturnValue(user)
      const result = await userService.refreshToken(user)
      expect(JwtProvider.verifyToken).toHaveBeenCalledWith(user, process.env.REFRESH_SECRET_SIGNATURE)
      expect(JwtProvider.generateToken).toHaveBeenCalledWith(user, process.env.ACCESS_SECRET_SIGNATURE, process.env.ACCESS_TOKEN_LIFE)
      expect(JwtProvider.generateToken).toHaveBeenCalledTimes(1)
      expect(result).toMatchObject({
        accessToken
      })
    })
    it('Should return status Not Acceptable when token is not valid', async () => {
      const user = null
      JwtProvider.verifyToken.mockReturnValue(user)
      const result = userService.refreshToken(user)
      await expect(result).rejects.toThrow()
      expect(JwtProvider.verifyToken).toHaveBeenCalledWith(user, process.env.REFRESH_SECRET_SIGNATURE)
      expect(JwtProvider.generateToken).not.toHaveBeenCalled()
    })
  })
  describe('update', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })
    it('Should update user', async () => {
      const user = {
        email: 'test@gmail.com',
        _id: 'userId'
      }
      const updateData = {
        displayName: 'test'
      }
      userModel.findOneById.mockResolvedValue(user)
      userModel.update.mockResolvedValue(updateData)
      const result = await userService.update(user._id, updateData)
      expect(userModel.findOneById).toHaveBeenCalledWith(user._id)
      expect(userModel.findOneById).toHaveBeenCalledTimes(1)
      expect(userModel.update).toHaveBeenCalledWith(user._id, updateData)
      expect(userModel.update).toHaveBeenCalledTimes(1)
      expect(result).toMatchObject(updateData)
    })
    it('Should return status Not Found when user is not exits', async () => {
      const user = {
        _id: 'userId'
      }
      userModel.findOneById.mockResolvedValue(null)
      const result = userService.update(user._id, {})
      await expect(result).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND,
        message: 'Không tìm thấy tài khoản!'
      })
      expect(userModel.findOneById).toHaveBeenCalledWith(user._id)
      expect(userModel.findOneById).toHaveBeenCalledTimes(1)
      expect(userModel.update).not.toHaveBeenCalled()
    })
    it('Should return status Not Acceptable when current password is incorrect', async () => {
      userModel.findOneById.mockResolvedValue({
        _id: 'userId',
        email: 'test@gmail.com',
        password: 'hashPassword',
        userName: 'test',
        displayName: 'test',
        isActive: true
      })

      bcryptjs.compare.mockResolvedValue(false)

      const result = userService.update('userId', {
        password: 'wrongPassword',
        newPassword: 'newPassword'
      })

      await expect(result).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_ACCEPTABLE,
        message: 'Mật khẩu hiện tại không chính xác!'
      })

      expect(userModel.findOneById).toHaveBeenCalledWith('userId')
      expect(bcryptjs.compare).toHaveBeenCalledWith(
        'wrongPassword',
        'hashPassword'
      )

      expect(userModel.update).not.toHaveBeenCalled()
    })
    it('Should update password when current password is correct', async () => {
      userModel.findOneById.mockResolvedValue({
        _id: 'userId',
        email: 'test@gmail.com',
        password: 'hashPassword',
        userName: 'test',
        displayName: 'test',
        isActive: true
      })

      bcryptjs.compare.mockResolvedValue(true)
      bcryptjs.hashSync.mockReturnValue('newHashPassword')

      userModel.update.mockResolvedValue({
        _id: 'userId',
        email: 'test@gmail.com',
        password: 'newHashPassword',
        userName: 'test',
        displayName: 'test',
        isActive: true
      })

      const result = await userService.update('userId', {
        password: 'currentPassword',
        newPassword: 'newPassword'
      })

      expect(userModel.findOneById).toHaveBeenCalledWith('userId')
      expect(bcryptjs.compare).toHaveBeenCalledWith(
        'currentPassword',
        'hashPassword'
      )

      expect(bcryptjs.hashSync).toHaveBeenCalledWith('newPassword', 8)
      expect(userModel.update).toHaveBeenCalledWith('userId', { password: 'newHashPassword' })
      expect(result).toBeDefined()
    })
    it('Should update user avatar', async () => {
      userModel.findOneById.mockResolvedValue({
        _id: 'userId',
        email: 'test@gmail.com',
        password: 'hashPassword',
        userName: 'test',
        displayName: 'test',
        isActive: true
      })

      const uploadResult = {
        secure_url: 'https://new-avatar.jpg'
      }

      CloudinaryProvider.streamUpload.mockResolvedValue(uploadResult)
      userModel.update.mockResolvedValue({
        _id: 'userId',
        email: 'test@gmail.com',
        password: 'hashPassword',
        userName: 'test',
        displayName: 'test',
        isActive: true,
        avatar: uploadResult.secure_url
      })

      const result = await userService.update('userId', {},
        {
          buffer: Buffer.from('avatar data'),
          mimetype: 'image/jpeg'
        }
      )

      expect(CloudinaryProvider.streamUpload).toHaveBeenCalledWith(
        Buffer.from('avatar data'),
        'users'
      )

      expect(userModel.update).toHaveBeenCalledWith('userId', {
        avatar: uploadResult.secure_url
      })

      expect(result).toBeDefined()
    })
  })
})
