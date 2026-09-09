import { userModel } from '~/models/userModel'
import bcryptjs from 'bcryptjs'
import { userService } from '~/services/userSevice'
import { v4 as uuidv4 } from 'uuid'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
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
  }
})
jest.mock('uuid', () => ({
  v4: jest.fn()
}))
describe('User service', () => {
  describe('createNew', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })
    it('Should create a new user', async () => {
      const hashPassword = 'hashPassword'
      bcryptjs.hashSync.mockResolvedValue(hashPassword)
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
      userModel.createNew.mockResolvedValue(fakeUser)
      userModel.findOneById.mockResolvedValue(fakeUser)
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
})
