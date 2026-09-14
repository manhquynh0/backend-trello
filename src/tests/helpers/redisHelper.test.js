import { redisHelper } from '~/helpers/redisHelper'
import { getRedisClient } from '~/config/redis'

jest.mock('~/config/redis', () => ({
  getRedisClient: jest.fn()
}))

describe('redisHelper', () => {
  let mockRedis

  beforeEach(() => {
    jest.clearAllMocks()
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      keys: jest.fn()
    }
    getRedisClient.mockReturnValue(mockRedis)
  })

  describe('get', () => {
    it('should parse and return JSON data when key exists', async () => {
      const fakeData = { foo: 'bar' }
      mockRedis.get.mockResolvedValue(JSON.stringify(fakeData))

      const result = await redisHelper.get('test_key')

      expect(mockRedis.get).toHaveBeenCalledWith('test_key')
      expect(result).toEqual(fakeData)
    })

    it('should return null when key does not exist', async () => {
      mockRedis.get.mockResolvedValue(null)

      const result = await redisHelper.get('non_existing')

      expect(mockRedis.get).toHaveBeenCalledWith('non_existing')
      expect(result).toBeNull()
    })
  })

  describe('set', () => {
    it('should serialize value and set with custom or default ttl', async () => {
      mockRedis.set.mockResolvedValue('OK')
      const value = { name: 'trello' }

      const result = await redisHelper.set('board_1', value, 1800)

      expect(mockRedis.set).toHaveBeenCalledWith('board_1', JSON.stringify(value), 'EX', 1800)
      expect(result).toBe('OK')
    })
  })

  describe('del', () => {
    it('should delete key and return result', async () => {
      mockRedis.del.mockResolvedValue(1)

      const result = await redisHelper.del('board_1')

      expect(mockRedis.del).toHaveBeenCalledWith('board_1')
      expect(result).toBe(1)
    })
  })

  describe('delByPattern', () => {
    it('should find keys by pattern and delete them if found', async () => {
      mockRedis.keys.mockResolvedValue(['board:1', 'board:2'])
      mockRedis.del.mockResolvedValue(2)

      const result = await redisHelper.delByPattern('board:*')

      expect(mockRedis.keys).toHaveBeenCalledWith('board:*')
      expect(mockRedis.del).toHaveBeenCalledWith(['board:1', 'board:2'])
      expect(result).toBe(2)
    })

    it('should not call del if no keys match pattern', async () => {
      mockRedis.keys.mockResolvedValue([])

      const result = await redisHelper.delByPattern('board:*')

      expect(mockRedis.keys).toHaveBeenCalledWith('board:*')
      expect(mockRedis.del).not.toHaveBeenCalled()
      expect(result).toBeUndefined()
    })
  })
})
