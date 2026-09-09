import { createAllTTLIndexes } from '~/config/createIndexs'

// Mock createAllTTLIndexes để không gọi vào logic database thật
jest.mock('~/config/createIndexs', () => ({
  createAllTTLIndexes: jest.fn().mockResolvedValue()
}))

// Mock MongoClient của mongodb
const mockDbInstance = {
  collection: jest.fn()
}
const mockConnect = jest.fn().mockResolvedValue()
const mockClose = jest.fn().mockResolvedValue()
const mockDb = jest.fn().mockReturnValue(mockDbInstance)

jest.mock('mongodb', () => ({
  MongoClient: jest.fn().mockImplementation(() => ({
    connect: mockConnect,
    close: mockClose,
    db: mockDb
  }))
}))

describe('Database Configuration', () => {
  let databaseModule

  beforeEach(() => {
    jest.clearAllMocks()
    // Dùng isolateModules để reset lại biến db = null giữa mỗi test case
    jest.isolateModules(() => {
      databaseModule = require('~/config/database')
    })
  })

  describe('GET_DB()', () => {
    it('should throw error if database is not connected yet', () => {
      expect(() => databaseModule.GET_DB()).toThrow('Must connect to Database first!!!')
    })

    it('should return db instance after successful connection', async () => {
      await databaseModule.Connect_DB()
      expect(databaseModule.GET_DB()).toBe(mockDbInstance)
    })
  })

  describe('Connect_DB()', () => {
    it('should connect to MongoClient, select database, and call createAllTTLIndexes', async () => {
      await databaseModule.Connect_DB()

      expect(mockConnect).toHaveBeenCalledTimes(1)
      expect(mockDb).toHaveBeenCalledTimes(1)
      expect(createAllTTLIndexes).toHaveBeenCalledTimes(1)
    })

    it('should throw error if MongoClient.connect fails', async () => {
      mockConnect.mockRejectedValueOnce(new Error('Connection failed'))

      await expect(databaseModule.Connect_DB()).rejects.toThrow('Connection failed')
    })
  })

  describe('Close_DB()', () => {
    it('should close client connection', async () => {
      await databaseModule.Close_DB()

      expect(mockClose).toHaveBeenCalledTimes(1)
    })
  })
})
