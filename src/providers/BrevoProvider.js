require('dotenv').config()
import { BrevoClient } from '@getbrevo/brevo'

const requiredEnvVars = ['BREVO_API_KEY', 'ADMIN_NAME', 'ADMIN_EMAIL']
for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    throw new Error(`Thiếu biến môi trường bắt buộc: ${key}`)
  }
}
const client = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY
})


const sendEmail = async (user, customSubject, content) => {
  try {
    const result = await client.transactionalEmails.sendTransacEmail({
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
    return result
  } catch (error) {
    console.error('Lỗi khi gửi email qua Brevo:', error?.message || error)
    throw error
  }
}

export const BrevoProvider = { sendEmail }