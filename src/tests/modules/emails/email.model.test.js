import { emailModel, EMAIL_TYPES, EMAIL_STATUS } from '~/models/emailModel'
import { GET_DB } from '~/config/database'
import { ObjectId } from 'mongodb'

// Mock WEBSITE_DOMAIN
jest.mock('~/utils/constants', () => ({
  WEBSITE_DOMAIN: 'http://localhost:5173'
}))

// Mock GET_DB
jest.mock('~/config/database', () => ({
  GET_DB: jest.fn()
}))

describe('emailModel', () => {
  const mockUser = {
    _id: '6ab9103225da0c4f93d4ac79',
    email: 'test@example.com',
    userName: 'testuser',
    verifyToken: 'abc123-verify-token'
  }

  let mockCollection

  beforeEach(() => {
    jest.clearAllMocks()
    mockCollection = {
      insertOne: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn()
    }
    GET_DB.mockReturnValue({
      collection: jest.fn().mockReturnValue(mockCollection)
    })
  })

  describe('buildVerificationEmail', () => {
    it('should return subject and html for verification email', () => {
      const { subject, html } = emailModel.buildVerificationEmail(mockUser)

      expect(subject).toBeTruthy()
      expect(typeof subject).toBe('string')
      expect(html).toContain(mockUser.userName)
      expect(html).toContain(mockUser.email)
      expect(html).toContain(mockUser.verifyToken)
      expect(html).toContain('http://localhost:5173/account/verification')
    })

    it('should embed verificationLink correctly in html', () => {
      const { html } = emailModel.buildVerificationEmail(mockUser)
      const expectedLink = `http://localhost:5173/account/verification?email=${mockUser.email}&token=${mockUser.verifyToken}`
      expect(html).toContain(expectedLink)
    })
  })

  describe('buildForgotPasswordEmail', () => {
    it('should return subject and html for forgot password email', () => {
      const newPassword = 'Qllo@2026123'
      const { subject, html } = emailModel.buildForgotPasswordEmail(mockUser, newPassword)

      expect(subject).toBeTruthy()
      expect(typeof subject).toBe('string')
      expect(html).toContain(mockUser.userName)
      expect(html).toContain(newPassword)
    })

    it('should include the new password in the html body', () => {
      const newPassword = 'Qllo@2026456'
      const { html } = emailModel.buildForgotPasswordEmail(mockUser, newPassword)
      expect(html).toContain(newPassword)
    })
  })

  describe('createNew / saveEmailLog', () => {
    it('should validate and insert email log with userId into collection', async () => {
      mockCollection.insertOne.mockResolvedValue({ insertedId: 'email-log-1' })

      const logData = {
        to: 'user@example.com',
        userId: '6ab9103225da0c4f93d4ac79',
        subject: 'Verify Account',
        type: EMAIL_TYPES.VERIFICATION,
        status: EMAIL_STATUS.SENT
      }

      const result = await emailModel.createNew(logData)

      expect(GET_DB).toHaveBeenCalled()
      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          userId: expect.any(ObjectId),
          subject: 'Verify Account',
          type: EMAIL_TYPES.VERIFICATION,
          status: EMAIL_STATUS.SENT,
          _destroy: false
        })
      )
      expect(result).toEqual({ insertedId: 'email-log-1' })
    })

    it('should insert email log without userId (null)', async () => {
      mockCollection.insertOne.mockResolvedValue({ insertedId: 'email-log-2' })

      const logData = {
        to: 'user2@example.com',
        subject: 'Reset Password',
        type: EMAIL_TYPES.FORGOT_PASSWORD,
        status: EMAIL_STATUS.FAILED,
        errorMessage: 'Brevo timeout'
      }

      const result = await emailModel.createNew(logData)

      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user2@example.com',
          userId: null,
          subject: 'Reset Password',
          type: EMAIL_TYPES.FORGOT_PASSWORD,
          status: EMAIL_STATUS.FAILED,
          errorMessage: 'Brevo timeout'
        })
      )
      expect(result).toEqual({ insertedId: 'email-log-2' })
    })

    it('should reject if invalid email address', async () => {
      const invalidData = {
        to: 'invalid-email',
        subject: 'Test',
        type: EMAIL_TYPES.VERIFICATION
      }

      await expect(emailModel.createNew(invalidData)).rejects.toThrow()
    })

    it('should reject if missing required subject', async () => {
      const invalidData = {
        to: 'valid@example.com',
        type: EMAIL_TYPES.VERIFICATION
      }

      await expect(emailModel.createNew(invalidData)).rejects.toThrow()
    })
  })

  describe('findOneById', () => {
    it('should find email by id', async () => {
      const fakeEmailDoc = { _id: new ObjectId('6ab9103225da0c4f93d4ac79'), to: 'user@example.com' }
      mockCollection.findOne.mockResolvedValue(fakeEmailDoc)

      const result = await emailModel.findOneById('6ab9103225da0c4f93d4ac79')

      expect(mockCollection.findOne).toHaveBeenCalledWith({
        _id: new ObjectId('6ab9103225da0c4f93d4ac79')
      })
      expect(result).toEqual(fakeEmailDoc)
    })
  })

  describe('findByEmail', () => {
    it('should find email logs by recipient email', async () => {
      const fakeList = [{ _id: '1', to: 'test@example.com' }]
      const mockCursor = {
        sort: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(fakeList)
      }
      mockCollection.find.mockReturnValue(mockCursor)

      const result = await emailModel.findByEmail('test@example.com')

      expect(mockCollection.find).toHaveBeenCalledWith({
        to: 'test@example.com',
        _destroy: false
      })
      expect(mockCursor.sort).toHaveBeenCalledWith({ createdAt: -1 })
      expect(result).toEqual(fakeList)
    })
  })
})
