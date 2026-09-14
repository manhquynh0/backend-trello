import { columnController } from '~/controllers/columnController'
import { columnService } from '~/services/columnService'
import { mockRequest, mockResponse, mockNext } from '~/tests/helpers/mockRequestResponse'
import { StatusCodes } from 'http-status-codes'

jest.mock('~/services/columnService', () => ({
  columnService: {
    createNew: jest.fn(),
    getDetails: jest.fn(),
    updatedColumn: jest.fn(),
    deletedColumn: jest.fn()
  }
}))

describe('columnController', () => {
  let req
  let res
  let next

  beforeEach(() => {
    jest.clearAllMocks()
    res = mockResponse()
    next = mockNext()
  })

  describe('createdNew', () => {
    it('should create column and return 201', async () => {
      const fakeColumn = { _id: 'col1', title: 'To Do' }
      columnService.createNew.mockResolvedValue(fakeColumn)
      req = mockRequest({ body: { title: 'To Do' } })

      await columnController.createdNew(req, res, next)

      expect(columnService.createNew).toHaveBeenCalledWith(req.body)
      expect(res.status).toHaveBeenCalledWith(StatusCodes.CREATED)
      expect(res.json).toHaveBeenCalledWith(fakeColumn)
    })

    it('should forward error to next if creation fails', async () => {
      const error = new Error('Create error')
      columnService.createNew.mockRejectedValue(error)
      req = mockRequest({ body: {} })

      await columnController.createdNew(req, res, next)

      expect(next).toHaveBeenCalledWith(error)
    })
  })

  describe('getDetails', () => {
    it('should return column details and status 200', async () => {
      const fakeColumn = { _id: 'col1', title: 'To Do' }
      columnService.getDetails.mockResolvedValue(fakeColumn)
      req = mockRequest({ params: { id: 'col1' } })

      await columnController.getDetails(req, res, next)

      expect(columnService.getDetails).toHaveBeenCalledWith('col1')
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK)
      expect(res.json).toHaveBeenCalledWith(fakeColumn)
    })

    it('should forward error to next if getDetails fails', async () => {
      const error = new Error('Get error')
      columnService.getDetails.mockRejectedValue(error)
      req = mockRequest({ params: { id: 'col1' } })

      await columnController.getDetails(req, res, next)

      expect(next).toHaveBeenCalledWith(error)
    })
  })

  describe('updatedColumn', () => {
    it('should update column and return status 200', async () => {
      const updatedData = { _id: 'col1', title: 'Done' }
      columnService.updatedColumn.mockResolvedValue(updatedData)
      req = mockRequest({ params: { id: 'col1' }, body: { title: 'Done' } })

      await columnController.updatedColumn(req, res, next)

      expect(columnService.updatedColumn).toHaveBeenCalledWith('col1', req.body)
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK)
      expect(res.json).toHaveBeenCalledWith(updatedData)
    })

    it('should forward error to next if updatedColumn fails', async () => {
      const error = new Error('Update error')
      columnService.updatedColumn.mockRejectedValue(error)
      req = mockRequest({ params: { id: 'col1' } })

      await columnController.updatedColumn(req, res, next)

      expect(next).toHaveBeenCalledWith(error)
    })
  })

  describe('deletedColumn', () => {
    it('should delete column and return status 200', async () => {
      const deleteResult = { deleteResult: 'success' }
      columnService.deletedColumn.mockResolvedValue(deleteResult)
      req = mockRequest({ params: { id: 'col1' } })

      await columnController.deletedColumn(req, res, next)

      expect(columnService.deletedColumn).toHaveBeenCalledWith('col1', { _destroy: true })
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK)
      expect(res.json).toHaveBeenCalledWith(deleteResult)
    })

    it('should forward error to next if deletedColumn fails', async () => {
      const error = new Error('Delete error')
      columnService.deletedColumn.mockRejectedValue(error)
      req = mockRequest({ params: { id: 'col1' } })

      await columnController.deletedColumn(req, res, next)

      expect(next).toHaveBeenCalledWith(error)
    })
  })
})
