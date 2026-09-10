import Redis from 'ioredis'
import {
  CONNECT_REDIS,
  getRedisClient
} from '~/config/redis'

const mockRedisClient = {
  on: jest.fn()
}

jest.mock('ioredis', () => {
  return jest.fn(() => mockRedisClient)
})

describe('Redis', () => {
  let redisModule
  beforeEach(() => {
    jest.clearAllMocks()
    jest.isolateModules(() => {
      redisModule = require('~/config/redis')
    })
  })

  describe('CONNECT_REDIS', () => {
    it('should create Redis client and return it', async () => {
      // Arrange
      process.env.REDIS_URL = 'redis://localhost:6379'

      // Act
      const result = await redisModule.CONNECT_REDIS()

      // Assert
      expect(Redis).toHaveBeenCalledTimes(1)
      expect(Redis).toHaveBeenCalledWith(
        'redis://localhost:6379'
      )

      expect(result).toBe(mockRedisClient)
    })

    it('should return existing Redis client instead of creating new one', async () => {
      // Arrange
      process.env.REDIS_URL = 'redis://localhost:6379'

      const firstClient = await redisModule.CONNECT_REDIS()

      // Act
      const secondClient = await redisModule.CONNECT_REDIS()

      // Assert
      expect(firstClient).toBe(secondClient)

      // Chỉ tạo Redis 1 lần
      expect(Redis).toHaveBeenCalledTimes(1)
    })
  })

  describe('getRedisClient', () => {
    it('should return Redis client after connecting', async () => {
      // Arrange
      process.env.REDIS_URL = 'redis://localhost:6379'

      const connectedClient = await redisModule.CONNECT_REDIS()

      // Act
      const result = redisModule.getRedisClient()

      // Assert
      expect(result).toBe(connectedClient)
    })

    it('should throw error if Redis client is not connected', () => {
      // Act
      expect(() => redisModule.getRedisClient()).toThrow('Must connect to Redis first!!!')
    })
  })
})