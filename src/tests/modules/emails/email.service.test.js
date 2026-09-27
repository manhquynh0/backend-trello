import { emailService } from '~/services/emailService'
import { emailModel, EMAIL_TYPES, EMAIL_STATUS } from '~/models/emailModel'
import { BrevoProvider } from '~/providers/BrevoProvider'

jest.mock('~/models/emailModel', () => ({
  EMAIL_TYPES: {
    VERIFICATION: 'VERIFICATION',
    FORGOT_PASSWORD: 'FORGOT_PASSWORD'
  },
  EMAIL_STATUS: {
    SENT: 'SENT',
    FAILED: 'FAILED'
  },
  emailModel: {
    EMAIL_TYPES: {
      VERIFICATION: 'VERIFICATION',
      FORGOT_PASSWORD: 'FORGOT_PASSWORD'
    },
    EMAIL_STATUS: {
      SENT: 'SENT',
      FAILED: 'FAILED'
    },
    buildVerificationEmail: jest.fn(),
    buildForgotPasswordEmail: jest.fn(),
    createNew: jest.fn()
  }
}))

jest.mock('~/providers/BrevoProvider', () => ({
  BrevoProvider: {
    sendEmail: jest.fn()
  }
}))

describe('emailService', () => {
  const mockUser = {
    _id: '6ab9103225da0c4f93d4ac79',
    email: 'test@example.com',
    userName: 'testuser',
    verifyToken: 'abc-token'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    emailModel.createNew.mockResolvedValue({ insertedId: 'email-id' })
  })

  describe('sendVerificationEmail', () => {
    it('should build email, send via Brevo, and save SENT log to database', async () => {
      const fakeTemplate = { subject: 'Verify Subject', html: '<p>Verify</p>' }
      emailModel.buildVerificationEmail.mockReturnValue(fakeTemplate)
      BrevoProvider.sendEmail.mockResolvedValue({ messageId: 'msg-1' })

      const result = await emailService.sendVerificationEmail(mockUser)

      expect(emailModel.buildVerificationEmail).toHaveBeenCalledWith(mockUser)
      expect(BrevoProvider.sendEmail).toHaveBeenCalledWith(
        mockUser,
        fakeTemplate.subject,
        fakeTemplate.html
      )
      expect(emailModel.createNew).toHaveBeenCalledWith({
        to: mockUser.email,
        userId: mockUser._id,
        subject: fakeTemplate.subject,
        type: EMAIL_TYPES.VERIFICATION,
        status: EMAIL_STATUS.SENT
      })
      expect(result).toEqual({ messageId: 'msg-1' })
    })

    it('should log FAILED in database and rethrow error if BrevoProvider fails', async () => {
      const fakeTemplate = { subject: 'Verify Subject', html: '<p>Verify</p>' }
      emailModel.buildVerificationEmail.mockReturnValue(fakeTemplate)
      BrevoProvider.sendEmail.mockRejectedValue(new Error('Brevo API error'))

      await expect(emailService.sendVerificationEmail(mockUser)).rejects.toThrow('Brevo API error')

      expect(emailModel.createNew).toHaveBeenCalledWith({
        to: mockUser.email,
        userId: mockUser._id,
        subject: fakeTemplate.subject,
        type: EMAIL_TYPES.VERIFICATION,
        status: EMAIL_STATUS.FAILED,
        errorMessage: 'Brevo API error'
      })
    })
  })

  describe('sendForgotPasswordEmail', () => {
    it('should build email, send via Brevo, and save SENT log to database', async () => {
      const newPassword = 'Qllo@2026123'
      const fakeTemplate = { subject: 'Forgot Subject', html: '<p>Forgot</p>' }
      emailModel.buildForgotPasswordEmail.mockReturnValue(fakeTemplate)
      BrevoProvider.sendEmail.mockResolvedValue({ messageId: 'msg-2' })

      const result = await emailService.sendForgotPasswordEmail(mockUser, newPassword)

      expect(emailModel.buildForgotPasswordEmail).toHaveBeenCalledWith(mockUser, newPassword)
      expect(BrevoProvider.sendEmail).toHaveBeenCalledWith(
        mockUser,
        fakeTemplate.subject,
        fakeTemplate.html
      )
      expect(emailModel.createNew).toHaveBeenCalledWith({
        to: mockUser.email,
        userId: mockUser._id,
        subject: fakeTemplate.subject,
        type: EMAIL_TYPES.FORGOT_PASSWORD,
        status: EMAIL_STATUS.SENT
      })
      expect(result).toEqual({ messageId: 'msg-2' })
    })

    it('should log FAILED in database and rethrow error if BrevoProvider fails', async () => {
      const fakeTemplate = { subject: 'Forgot Subject', html: '<p>Forgot</p>' }
      emailModel.buildForgotPasswordEmail.mockReturnValue(fakeTemplate)
      BrevoProvider.sendEmail.mockRejectedValue(new Error('Send failed'))

      await expect(emailService.sendForgotPasswordEmail(mockUser, 'newPwd')).rejects.toThrow('Send failed')

      expect(emailModel.createNew).toHaveBeenCalledWith({
        to: mockUser.email,
        userId: mockUser._id,
        subject: fakeTemplate.subject,
        type: EMAIL_TYPES.FORGOT_PASSWORD,
        status: EMAIL_STATUS.FAILED,
        errorMessage: 'Send failed'
      })
    })
  })
})
