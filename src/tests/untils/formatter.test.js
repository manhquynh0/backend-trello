import { slugify, pickUser } from '~/utils/formatter'

// ==================== slugify ====================
describe('slugify()', () => {
  it('should convert spaces to hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('should remove accented/diacritical characters (Vietnamese)', () => {
    expect(slugify('Nguyễn Văn A')).toBe('nguyen-van-a')
  })

  it('should convert to lowercase', () => {
    expect(slugify('HELLO')).toBe('hello')
  })

  it('should remove consecutive hyphens', () => {
    expect(slugify('hello   world')).toBe('hello-world')
  })

  it('should remove special characters', () => {
    expect(slugify('hello@world!')).toBe('helloworld')
  })

  it('should trim leading and trailing whitespace', () => {
    expect(slugify('  hello  ')).toBe('hello')
  })

  it('should return empty string when value is falsy', () => {
    expect(slugify('')).toBe('')
    expect(slugify(null)).toBe('')
    expect(slugify(undefined)).toBe('')
  })
})

// ==================== pickUser ====================
describe('pickUser()', () => {
  const mockUser = {
    _id: '123',
    email: 'test@gmail.com',
    userName: 'testuser',
    displayName: 'Test User',
    role: 'admin',
    avatar: 'avatar.png',
    password: 'secret',       // ← phải bị loại bỏ
    refreshToken: 'token123'  // ← phải bị loại bỏ
  }

  it('should return only allowed fields', () => {
    const result = pickUser(mockUser)
    expect(result).toEqual({
      _id: '123',
      email: 'test@gmail.com',
      userName: 'testuser',
      displayName: 'Test User',
      role: 'admin',
      avatar: 'avatar.png'
    })
  })

  it('should NOT include sensitive fields like password, refreshToken', () => {
    const result = pickUser(mockUser)
    expect(result).not.toHaveProperty('password')
    expect(result).not.toHaveProperty('refreshToken')
  })

  it('should return undefined when user is falsy', () => {
    expect(pickUser(null)).toBeUndefined()
    expect(pickUser(undefined)).toBeUndefined()
  })
})
