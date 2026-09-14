import { multerUploadMiddleware } from '~/middlewares/multerUpLoadMiddleware'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'

describe('multerUploadMiddleware', () => {
  it('should have upload instance configured with fileFilter', () => {
    expect(multerUploadMiddleware.upload).toBeDefined()
    expect(typeof multerUploadMiddleware.upload.fileFilter).toBe('function')
  })

  describe('customFileFilter', () => {
    const fileFilter = multerUploadMiddleware.upload.fileFilter

    describe('when fieldname includes "cover"', () => {
      it('should accept valid cover image mimetype (image/jpeg)', () => {
        const callback = jest.fn()
        const file = { fieldname: 'boardCover', mimetype: 'image/jpeg' }

        fileFilter({}, file, callback)

        expect(callback).toHaveBeenCalledWith(null, true)
      })

      it('should accept valid cover image mimetype (image/png)', () => {
        const callback = jest.fn()
        const file = { fieldname: 'cardCover', mimetype: 'image/png' }

        fileFilter({}, file, callback)

        expect(callback).toHaveBeenCalledWith(null, true)
      })

      it('should reject invalid cover image mimetype', () => {
        const callback = jest.fn()
        const file = { fieldname: 'boardCover', mimetype: 'application/pdf' }

        fileFilter({}, file, callback)

        expect(callback).toHaveBeenCalledTimes(1)
        const error = callback.mock.calls[0][0]
        expect(error).toBeInstanceOf(ApiError)
        expect(error.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
        expect(error.message).toContain('File type is invalid, Only accept jpg, png or jpeg')
      })
    })

    describe('when fieldname does not include "cover"', () => {
      it('should accept valid common file types (pdf, docx, etc.)', () => {
        const callback = jest.fn()
        const file = { fieldname: 'attachments', mimetype: 'application/pdf' }

        fileFilter({}, file, callback)

        expect(callback).toHaveBeenCalledWith(null, true)
      })

      it('should reject unsupported file types (exe, mp4, etc.)', () => {
        const callback = jest.fn()
        const file = { fieldname: 'attachments', mimetype: 'video/mp4' }

        fileFilter({}, file, callback)

        expect(callback).toHaveBeenCalledTimes(1)
        const error = callback.mock.calls[0][0]
        expect(error).toBeInstanceOf(ApiError)
        expect(error.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
        expect(error.message).toContain('File type is invalid, Only accept jpg, png, jpeg, pdf')
      })
    })
  })
})
