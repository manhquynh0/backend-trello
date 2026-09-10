import { userModel } from '~/models/userModel'
import { GET_DB } from '~/config/database'
import { ObjectId } from 'mongodb'

const mockInsertOne = jest.fn()
const mockFindOne = jest.fn()
const mockFindOneAndUpdate = jest.fn()

const mockCollection = {
  insertOne: mockInsertOne,
  findOne: mockFindOne,
  findOneAndUpdate: mockFindOneAndUpdate
}

const mockDb = {
  collection: jest.fn(() => mockCollection)
}

jest.mock('~/config/database', () => ({
  GET_DB: jest.fn(() => mockDb)
}))

describe('User model', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  afterEach(() => {
    jest.useRealTimers()
  })

  describe('createNew', () => {
    it('should validate data, add createdAt, insert and return', async () => {
      // Arrange
      jest.useFakeTimers()

      const mockDate = new Date('2026-09-10T11:00:00.000Z')
      jest.setSystemTime(mockDate)

      const insertedId = new ObjectId()

      mockInsertOne.mockResolvedValue({
        insertedId
      })

      const fakeUser = {
        email: 'test@gmail.com',
        password: 'Hashed-password-example-123@',
        userName: 'test',
        displayName: 'test',
        verifyToken: '123'
      }
      // Act
      const result = await userModel.createNew(fakeUser)

      // Assert
      expect(result).toEqual({
        insertedId
      })

      // Kiểm tra insertOne được gọi
      expect(mockInsertOne).toHaveBeenCalledTimes(1)

      // Kiểm tra dữ liệu sau khi validate
      expect(mockInsertOne).toHaveBeenCalledWith({
        ...fakeUser,
        createdAt: mockDate.getTime(),
        _destroy: false,
        updatedAt: null,
        role: 'client',
        isActive: false,
        avatar: null
      })
    })
  })

  describe('findOneById', () => {
    it('should find one by id and return', async () => {
      const id = '69142686ac041cc814ddb945'
      const expectedUser = {
        _id: new ObjectId(id),
        email: 'test@gmail.com',
        password: 'hashPassword',
        userName: 'test',
        displayName: 'test',
        role: 'client',
        isActive: false,
        verifyToken: null,
        createdAt: Date.now(),
        updatedAt: null,
        _destroy: false
      }
      mockFindOne.mockResolvedValue(expectedUser)

      const result = await userModel.findOneById(id)

      expect(result).toEqual(expectedUser)
      expect(mockFindOne).toHaveBeenCalledWith({ _id: new ObjectId(id) })
      expect(mockFindOne).toHaveBeenCalledTimes(1)
    })
  })

  describe('findOneByEmail', () => {
    it('should find one by email and return', async () => {
      const email = 'test@gmail.com'
      const expectedUser = {
        _id: new ObjectId('69142686ac041cc814ddb945'),
        email: email,
        password: 'hashPassword',
        userName: 'test',
        displayName: 'test',
        role: 'client',
        isActive: false,
        verifyToken: null,
        createdAt: Date.now(),
        updatedAt: null,
        _destroy: false
      }
      mockFindOne.mockResolvedValue(expectedUser)

      const result = await userModel.findOneByEmail(email)

      expect(result).toEqual(expectedUser)
      expect(mockFindOne).toHaveBeenCalledWith({ email })
      expect(mockFindOne).toHaveBeenCalledTimes(1)
    })
  })

  describe('update', () => {
    it('should update user and return after update', async () => {
      // Arrange
      jest.useFakeTimers()

      const userId = '69142686ac041cc814ddb945'
      const updateData = {
        displayName: 'newDisplayName',
        avatar: 'https://example.com/new-avatar.jpg'
      }
      const mockDate = new Date('2026-09-10T11:00:00.000Z')
      jest.setSystemTime(mockDate)

      const updatedUser = {
        _id: new ObjectId(userId),
        email: 'test@gmail.com',
        password: 'hashPassword',
        userName: 'test',
        displayName: 'newDisplayName',
        avatar: 'https://example.com/new-avatar.jpg',
        role: 'client',
        isActive: false,
        verifyToken: null,
        createdAt: Date.now(),
        updatedAt: mockDate.getTime(),
        _destroy: false
      }

      mockFindOneAndUpdate.mockResolvedValue(updatedUser)

      // Act
      const result = await userModel.update(userId, updateData)

      // Assert
      expect(result).toEqual(updatedUser)
      expect(mockFindOneAndUpdate).toHaveBeenCalledTimes(1)
      expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
        { _id: new ObjectId(userId) },
        { $set: updateData },
        { returnDocument: 'after' }
      )
    })
  })

})