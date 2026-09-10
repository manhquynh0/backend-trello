import { BrevoProvider } from '~/providers/BrevoProvider'

const mockSendTransacEmail = jest.fn()

jest.mock('@getbrevo/brevo', () => ({
  BrevoClient: jest.fn().mockImplementation(() => ({
    transactionalEmails: {
      sendTransacEmail: (...args) => mockSendTransacEmail(...args)
    }
  }))
}))

describe('BrevoProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should send email successfully', async () => {
    const mockResult = { messageId: '<test@brevo.com>' }
    mockSendTransacEmail.mockResolvedValue(mockResult)

    const user = {
      email: 'test@example.com',
      username: 'Admin'
    }
    const customSubject = 'Test subject'
    const content = 'Test content'

    const result = await BrevoProvider.sendEmail(user, customSubject, content)

    expect(result).toEqual(mockResult)
    expect(mockSendTransacEmail).toHaveBeenCalledTimes(1)
    expect(mockSendTransacEmail).toHaveBeenCalledWith({
      sender: {
        name: process.env.ADMIN_NAME,
        email: process.env.ADMIN_EMAIL
      },
      to: [{
        email: user.email,
        name: user.username
      }],
      subject: customSubject,
      htmlContent: content
    })
  })

  test('should throw error when sending email fails', async () => {
    const mockError = new Error('Brevo service error')
    mockSendTransacEmail.mockRejectedValue(mockError)

    const user = {
      email: 'test@example.com',
      username: 'Admin'
    }

    await expect(
      BrevoProvider.sendEmail(user, 'Test subject', 'Test content')
    ).rejects.toThrow('Brevo service error')

    expect(mockSendTransacEmail).toHaveBeenCalledTimes(1)
  })
})