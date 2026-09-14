import { rateLimit, ipKeyGenerator } from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import { CONNECT_REDIS } from '~/config/redis'
import { StatusCodes } from 'http-status-codes'

const isTest = process.env.NODE_ENV === 'test'

const createRedisStore = (prefix) => {
  if (isTest) return undefined
  return new RedisStore({
    sendCommand: async (...args) => {
      const client = await CONNECT_REDIS()
      return client.call(...args)
    },
    prefix
  })
}

// 1. Cấu hình Rate Limiter chung cho toàn bộ API (ví dụ: 100 requests / 5 phút)
export const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 phút
  limit: 100, // Tối đa 100 request mỗi IP / User trong windowMs
  standardHeaders: 'draft-7', // Trả về headers chuẩn: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
  legacyHeaders: false, // Tắt headers cũ `X-RateLimit-*`
  validate: { ip: false },
  store: createRedisStore('rl:common:'),
  keyGenerator: (req) => {
    return req.jwtDecoded?._id || ipKeyGenerator(req.ip)
  },
  message: {
    statusCode: StatusCodes.TOO_MANY_REQUESTS,
    message: 'Bạn đã gửi quá nhiều yêu cầu! Vui lòng thử lại sau 5 phút.'
  }
})

// 2. Cấu hình Rate Limiter nghiêm ngặt cho các route nhạy cảm (Login, Register: 5 lần / 5 phút)
export const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 phút
  limit: 5, // Tối đa 5 lần thử mỗi IP
  skipSuccessfulRequests: true, // chỉ đếm request thất bại (status >= 400)
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  validate: { ip: false },
  store: createRedisStore('rl:auth:'),
  keyGenerator: (req) => {
    return req.jwtDecoded?._id || ipKeyGenerator(req.ip)
  },
  message: {
    statusCode: StatusCodes.TOO_MANY_REQUESTS,
    message: 'Quá nhiều lần đăng nhập không thành công. Vui lòng thử lại sau 5 phút.'
  }
})
