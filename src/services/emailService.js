import { BrevoProvider } from '~/providers/BrevoProvider'
import { emailModel, EMAIL_TYPES, EMAIL_STATUS } from '~/models/emailModel'

/**
 * Gửi email xác thực tài khoản cho user mới đăng ký và lưu log vào database
 * @param {Object} user - User vừa tạo (cần email, userName, verifyToken)
 */
const sendVerificationEmail = async (user) => {
  const { subject, html } = emailModel.buildVerificationEmail(user)
  try {
    const result = await BrevoProvider.sendEmail(user, subject, html)
    await emailModel.createNew({
      to: user.email,
      userId: user._id,
      subject,
      type: EMAIL_TYPES.VERIFICATION,
      status: EMAIL_STATUS.SENT
    })
    return result
  } catch (error) {
    await emailModel.createNew({
      to: user.email,
      userId: user._id,
      subject,
      type: EMAIL_TYPES.VERIFICATION,
      status: EMAIL_STATUS.FAILED,
      errorMessage: error.message
    }).catch(() => {})
    throw error
  }
}

/**
 * Gửi email chứa mật khẩu mới khi user quên mật khẩu và lưu log vào database
 * @param {Object} user - User cần reset (cần email, userName)
 * @param {string} newPassword - Mật khẩu mới được tạo tự động
 */
const sendForgotPasswordEmail = async (user, newPassword) => {
  const { subject, html } = emailModel.buildForgotPasswordEmail(user, newPassword)
  try {
    const result = await BrevoProvider.sendEmail(user, subject, html)
    await emailModel.createNew({
      to: user.email,
      userId: user._id,
      subject,
      type: EMAIL_TYPES.FORGOT_PASSWORD,
      status: EMAIL_STATUS.SENT
    })
    return result
  } catch (error) {
    await emailModel.createNew({
      to: user.email,
      userId: user._id,
      subject,
      type: EMAIL_TYPES.FORGOT_PASSWORD,
      status: EMAIL_STATUS.FAILED,
      errorMessage: error.message
    }).catch(() => {})
    throw error
  }
}

export const emailService = {
  sendVerificationEmail,
  sendForgotPasswordEmail
}
