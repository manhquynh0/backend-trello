import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/database'
import { WEBSITE_DOMAIN } from '~/utils/constants'
import {
  EMAIL_RULE,
  EMAIL_RULE_MESSAGE,
  OBJECT_ID_RULE,
  OBJECT_ID_RULE_MESSAGE
} from '~/utils/validators'

const EMAIL_COLLECTION_NAME = 'emails'

export const EMAIL_TYPES = {
  VERIFICATION: 'VERIFICATION',
  FORGOT_PASSWORD: 'FORGOT_PASSWORD'
}

export const EMAIL_STATUS = {
  SENT: 'SENT',
  FAILED: 'FAILED'
}

const EMAIL_COLLECTION_SCHEMA = Joi.object({
  to: Joi.string().required().pattern(EMAIL_RULE).message(EMAIL_RULE_MESSAGE),
  userId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).allow(null).default(null),
  subject: Joi.string().required().trim().strict(),
  type: Joi.string().valid(EMAIL_TYPES.VERIFICATION, EMAIL_TYPES.FORGOT_PASSWORD).required(),
  status: Joi.string().valid(EMAIL_STATUS.SENT, EMAIL_STATUS.FAILED).default(EMAIL_STATUS.SENT),
  errorMessage: Joi.string().allow(null, '').default(null),
  createdAt: Joi.date().timestamp('javascript').default(() => Date.now()),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const validateBeforeCreate = async (data) => {
  return await EMAIL_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

/**
 * Lưu thông tin log email đã gửi vào MongoDB
 * @param {Object} data - { to, userId, subject, type, status, errorMessage }
 * @returns {Promise<InsertOneResult>}
 */
const createNew = async (data) => {
  try {
    const rawData = {
      ...data,
      userId: data.userId ? data.userId.toString() : null
    }
    const validatedData = await validateBeforeCreate(rawData)
    const insertData = {
      ...validatedData,
      userId: validatedData.userId ? new ObjectId(validatedData.userId) : null
    }
    const result = await GET_DB().collection(EMAIL_COLLECTION_NAME).insertOne(insertData)
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async (id) => {
  try {
    const result = await GET_DB().collection(EMAIL_COLLECTION_NAME).findOne({
      _id: new ObjectId(id)
    })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const findByEmail = async (email) => {
  try {
    const result = await GET_DB().collection(EMAIL_COLLECTION_NAME).find({
      to: email,
      _destroy: false
    }).sort({ createdAt: -1 }).toArray()
    return result
  } catch (error) {
    throw new Error(error)
  }
}

/**
 * Tạo nội dung email xác thực tài khoản khi đăng ký
 * @param {Object} user - User vừa đăng ký (cần có: email, userName, verifyToken)
 * @returns {{ subject: string, html: string }}
 */
const buildVerificationEmail = (user) => {
  const verificationLink = `${WEBSITE_DOMAIN}/account/verification?email=${user.email}&token=${user.verifyToken}`
  const subject = 'ManhQuynhDev – Xác thực tài khoản QLLO'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #6366f1;">Chào ${user.userName}! 👋</h2>
      <p>Cảm ơn bạn đã tạo tài khoản QLLO.</p>
      <p>Vui lòng nhấn vào nút bên dưới để xác thực địa chỉ email của bạn.</p>
      <p style="color: #888; font-size: 13px;">Liên kết này sẽ hết hạn sau <strong>30 phút</strong>.</p>
      <a href="${verificationLink}"
        style="
          display: inline-block;
          margin-top: 12px;
          padding: 12px 24px;
          background-color: #6366f1;
          color: #fff;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
        ">
        Xác thực tài khoản
      </a>
      <p style="margin-top: 24px; font-size: 12px; color: #aaa;">
        Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin-top: 24px;" />
      <p style="font-size: 12px; color: #aaa;">ManhQuynhDev &copy; 2026</p>
    </div>
  `
  return { subject, html }
}

/**
 * Tạo nội dung email quên mật khẩu
 * @param {Object} user - User cần reset mật khẩu (cần có: userName, email)
 * @param {string} newPassword - Mật khẩu mới được tạo tự động
 * @returns {{ subject: string, html: string }}
 */
const buildForgotPasswordEmail = (user, newPassword) => {
  const subject = 'QLLO – Đặt lại mật khẩu'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #6366f1;">Xin chào ${user.userName}! 🔑</h2>
      <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu của bạn.</p>
      <p>Mật khẩu mới của bạn là:</p>
      <div style="
        background-color: #f4f4f5;
        border: 1px solid #e4e4e7;
        border-radius: 6px;
        padding: 12px 20px;
        font-size: 18px;
        font-family: monospace;
        letter-spacing: 2px;
        display: inline-block;
        margin: 8px 0;
      ">
        ${newPassword}
      </div>
      <p style="color: #ef4444; font-weight: bold; margin-top: 12px;">
        ⚠️ Vui lòng đổi mật khẩu ngay sau khi đăng nhập.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin-top: 24px;" />
      <p style="font-size: 12px; color: #aaa;">ManhQuynhDev &copy; 2026</p>
    </div>
  `
  return { subject, html }
}

export const emailModel = {
  EMAIL_COLLECTION_NAME,
  EMAIL_COLLECTION_SCHEMA,
  EMAIL_TYPES,
  EMAIL_STATUS,
  createNew,
  saveEmailLog: createNew,
  findOneById,
  findByEmail,
  buildVerificationEmail,
  buildForgotPasswordEmail
}
