import { cardValidations } from '~/validations/cardValidations'
import { mockRequest, mockResponse, mockNext } from '~/tests/helpers/mockRequestResponse'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import { ObjectId } from 'mongodb'

describe('cardValidations', () => {
  let res
  let next

  beforeEach(() => {
    res = mockResponse()
    next = mockNext()
  })

  describe('createdNew', () => {
    it('should call next when card body is valid', async () => {
      const req = mockRequest({
        body: {
          boardId: new ObjectId().toString(),
          columnId: new ObjectId().toString(),
          title: 'Design Mockup'
        }
      })

      await cardValidations.createdNew(req, res, next)

      expect(next).toHaveBeenCalledWith()
    })

    it('should fail when missing boardId, columnId, or title', async () => {
      const req = mockRequest({
        body: {
          title: 'Design Mockup'
        }
      })

      await cardValidations.createdNew(req, res, next)

      expect(next).toHaveBeenCalledTimes(1)
      const error = next.mock.calls[0][0]
      expect(error).toBeInstanceOf(ApiError)
      expect(error.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
    })
  })

  describe('updated', () => {
    it('should call next when update card body is valid', async () => {
      const req = mockRequest({
        body: {
          title: 'Updated Card Title',
          description: 'Detailed description'
        }
      })

      await cardValidations.updated(req, res, next)

      expect(next).toHaveBeenCalledWith()
    })

    it('should fail when title is too short', async () => {
      const req = mockRequest({
        body: {
          title: 'a'
        }
      })

      await cardValidations.updated(req, res, next)

      expect(next).toHaveBeenCalledTimes(1)
      const error = next.mock.calls[0][0]
      expect(error).toBeInstanceOf(ApiError)
      expect(error.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
    })
  })

  describe('createdAttachment', () => {
    it('should call next when attachment list is valid', async () => {
      const req = mockRequest({
        body: {
          attachments: [
            {
              url: 'https://cloudinary.com/test.jpg',
              filetype: 'image/jpeg',
              name: 'Sample Image'
            }
          ]
        }
      })

      await cardValidations.createdAttachment(req, res, next)

      expect(next).toHaveBeenCalledWith()
    })

    it('should fail when attachment is missing required url or filetype', async () => {
      const req = mockRequest({
        body: {
          attachments: [
            {
              name: 'Sample Image'
            }
          ]
        }
      })

      await cardValidations.createdAttachment(req, res, next)

      expect(next).toHaveBeenCalledTimes(1)
      const error = next.mock.calls[0][0]
      expect(error).toBeInstanceOf(ApiError)
      expect(error.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
    })
  })

  describe('createdLabel and updateLabel', () => {
    it('should validate createdLabel successfully', async () => {
      const req = mockRequest({
        body: {
          labels: [{ name: 'Bug Fix', color: '#ff0000' }]
        }
      })

      await cardValidations.createdLabel(req, res, next)

      expect(next).toHaveBeenCalledWith()
    })

    it('should fail createdLabel when missing color', async () => {
      const req = mockRequest({
        body: {
          labels: [{ name: 'Bug Fix' }]
        }
      })

      await cardValidations.createdLabel(req, res, next)

      expect(next).toHaveBeenCalledTimes(1)
      const error = next.mock.calls[0][0]
      expect(error).toBeInstanceOf(ApiError)
      expect(error.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
    })

    it('should validate updateLabel successfully', async () => {
      const req = mockRequest({
        body: { name: 'Urgent Bug', color: '#cc0000' }
      })

      await cardValidations.updateLabel(req, res, next)

      expect(next).toHaveBeenCalledWith()
    })

    it('should fail updateLabel if title is invalid', async () => {
      const req = mockRequest({
        body: { name: 'x' }
      })

      await cardValidations.updateLabel(req, res, next)

      expect(next).toHaveBeenCalledTimes(1)
      const error = next.mock.calls[0][0]
      expect(error).toBeInstanceOf(ApiError)
      expect(error.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
    })
  })

  describe('checklists and checklist items', () => {
    it('should validate createdChecklist successfully', async () => {
      const req = mockRequest({ body: { name: 'Frontend Checklist' } })
      await cardValidations.createdChecklist(req, res, next)
      expect(next).toHaveBeenCalledWith()
    })

    it('should fail createdChecklist if name is missing', async () => {
      const req = mockRequest({ body: {} })
      await cardValidations.createdChecklist(req, res, next)
      expect(next).toHaveBeenCalledTimes(1)
      expect(next.mock.calls[0][0]).toBeInstanceOf(ApiError)
    })

    it('should validate createdChecklistItem successfully', async () => {
      const req = mockRequest({ body: { name: 'Step 1: Wireframe' } })
      await cardValidations.createdChecklistItem(req, res, next)
      expect(next).toHaveBeenCalledWith()
    })

    it('should fail createdChecklistItem if name is missing', async () => {
      const req = mockRequest({ body: {} })
      await cardValidations.createdChecklistItem(req, res, next)
      expect(next).toHaveBeenCalledTimes(1)
      expect(next.mock.calls[0][0]).toBeInstanceOf(ApiError)
    })

    it('should validate updatedChecklistItem successfully', async () => {
      const req = mockRequest({ body: { isSuccess: true } })
      await cardValidations.updatedChecklistItem(req, res, next)
      expect(next).toHaveBeenCalledWith()
    })

    it('should fail updatedChecklistItem if body is empty', async () => {
      const req = mockRequest({ body: {} })
      await cardValidations.updatedChecklistItem(req, res, next)
      expect(next).toHaveBeenCalledTimes(1)
      expect(next.mock.calls[0][0]).toBeInstanceOf(ApiError)
    })
  })
})
