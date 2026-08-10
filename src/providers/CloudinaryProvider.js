require('dotenv').config()
import cloudinary from 'cloudinary'
import streamifier from 'streamifier'

const cloudinaryV2 = cloudinary.v2
cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_API_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})
const streamUpload = (fileBuffer, folderName) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinaryV2.uploader.upload_stream({ folder: folderName }, (err, result) => {
      if (err) return reject(err)
      resolve(result)
    })

    const readStream = streamifier.createReadStream(fileBuffer)

    // Bắt lỗi ở CẢ 2 phía của pipe — đây là phần đang thiếu
    readStream.on('error', (err) => reject(err))
    stream.on('error', (err) => reject(err))

    readStream.pipe(stream)
  })
}
export const CloudinaryProvider = {
  streamUpload
}