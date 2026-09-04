import { JwtProvider } from '~/providers/JwtProvider'

const SECRET = 'test_secret_key_123'
const PAYLOAD = { _id: 'user123', email: 'test@gmail.com', role: 'client' }

describe('JwtProvider', () => {

  // ==================== generateToken ====================
  describe('generateToken()', () => {
    it('should return a valid JWT string', () => {
      const token = JwtProvider.generateToken(PAYLOAD, SECRET, '1h')
      // JWT có dạng xxx.yyy.zzz
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3)
    })

    it('should encode payload correctly inside the token', () => {
      const token = JwtProvider.generateToken(PAYLOAD, SECRET, '1h')
      const decoded = JwtProvider.verifyToken(token, SECRET)
      expect(decoded._id).toBe(PAYLOAD._id)
      expect(decoded.email).toBe(PAYLOAD.email)
      expect(decoded.role).toBe(PAYLOAD.role)
    })

    it('should throw error when called without required args', () => {
      expect(() => JwtProvider.generateToken(null, null, '1h')).toThrow()
    })
  })

  // ==================== verifyToken ====================
  describe('verifyToken()', () => {
    it('should successfully verify a valid token', () => {
      const token = JwtProvider.generateToken(PAYLOAD, SECRET, '1h')
      const decoded = JwtProvider.verifyToken(token, SECRET)
      expect(decoded).toMatchObject(PAYLOAD)
    })

    it('should throw error when token is signed with wrong secret', () => {
      const token = JwtProvider.generateToken(PAYLOAD, SECRET, '1h')
      expect(() => JwtProvider.verifyToken(token, 'wrong_secret')).toThrow()
    })

    it('should throw error when token is expired', async () => {
      // tạo token hết hạn ngay lập tức (1ms)
      const token = JwtProvider.generateToken(PAYLOAD, SECRET, '1ms')
      // đợi token hết hạn
      await new Promise((resolve) => setTimeout(resolve, 10))
      expect(() => JwtProvider.verifyToken(token, SECRET)).toThrow()
    })

    it('should throw error when token string is invalid/malformed', () => {
      expect(() => JwtProvider.verifyToken('not.a.valid.token', SECRET)).toThrow()
    })
  })
})
