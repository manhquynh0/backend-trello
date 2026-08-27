import Redis from 'ioredis'
import 'dotenv/config'

let redisClient = null

export const CONNECT_REDIS = async () => {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL)

    redisClient.on('connect', () => {
      console.log('Connected to Redis Server successfully!')
    })

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err)
    })
  }

  return redisClient
}

export const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Must connect to Redis first!!!')
  }
  return redisClient
}