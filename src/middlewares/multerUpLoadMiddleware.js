import multer from 'multer'
import ApiError from '~/utils/ApiError'
import {
  StatusCodes
} from 'http-status-codes'
import {
  LIMIT_COMMON_FILE_SIZE,
  ALLOW_COMMON_FILE_SIZE
} from '~/utils/validators'
const customFileFilter = (req, file, callback) => {

  if (!ALLOW_COMMON_FILE_SIZE.includes(file.mimetype)) {
    const errMessage = 'File type is invalid, Only accept jpg, png or jpeg'
    return callback(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errMessage), null)
  }
  return callback(null, true)
}

// khoi tao function upload dc boc boi multer

const upload = multer({
  limits: {
    fileSize: LIMIT_COMMON_FILE_SIZE
  },
  fileFilter: customFileFilter
})
export const multerUploadMiddleware = {
  upload
}