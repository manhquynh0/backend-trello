import 'dotenv/config'
import {
  getRedisClient
} from '~/config/redis'
export const redisHelper = {

  get: async (key) => {
    const data = await getRedisClient().get(key)
    return data ? JSON.parse(data) : null
  },
  set: async (key, value, ttl = process.env.REDIS_DEFAULT_TTL || 3600) => {
    const data = await getRedisClient().set(key, JSON.stringify(value), 'EX', ttl)
    return data
  },
  del: async (key) => {
    const data = await getRedisClient().del(key)
    return data
  },
  delByPattern: async (pattern) => {
    const keys = await getRedisClient().keys(pattern)
    if (keys.length > 0) {
      const data = await getRedisClient().del(keys)
      return data
    }
  }

}