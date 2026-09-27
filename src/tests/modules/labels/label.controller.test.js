import { labelController } from '~/controllers/labelController'
import { labelService } from '~/services/labelService'
import { StatusCodes } from 'http-status-codes'

jest.mock('~/services/labelService', () => ({
  labelService: {
    createNew: jest.fn(),
    getLabels: jest.fn(),
    updateLabel: jest.fn(),
    deleteLabel: jest.fn()
  }
}))

describe('labelController', () => {
  let req
  let res
  let next

  beforeEach(() => {
    jest.clearAllMocks()
    req = {
      params: {},
      query: {},
      body: {}
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    next = jest.fn()
  })

  describe('createNew', () => {
    it('should call labelService.createNew and return 201', async () => {
      const fakeResult = { _id: 'lbl1', name: 'Bug' }
      labelService.createNew.mockResolvedValue(fakeResult)
      req.params = { id: 'c1' }
      req.body = { name: 'Bug', color: '#ff0000' }

      await labelController.createNew(req, res, next)

      expect(labelService.createNew).toHaveBeenCalledWith('c1', req.body)
      expect(res.status).toHaveBeenCalledWith(StatusCodes.CREATED)
      expect(res.json).toHaveBeenCalledWith(fakeResult)
    })

    it('should forward error to next if createNew throws', async () => {
      const err = new Error('creation failed')
      labelService.createNew.mockRejectedValue(err)
      req.params = { id: 'c1' }

      await labelController.createNew(req, res, next)

      expect(next).toHaveBeenCalledWith(err)
    })
  })

  describe('getLabels', () => {
    it('should call labelService.getLabels and return 200', async () => {
      const fakeLabels = { labels: [{ name: 'Bug' }] }
      labelService.getLabels.mockResolvedValue(fakeLabels)
      req.params = { id: 'c1' }
      req.query = { name: 'bug' }

      await labelController.getLabels(req, res, next)

      expect(labelService.getLabels).toHaveBeenCalledWith('c1', req.query)
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK)
      expect(res.json).toHaveBeenCalledWith(fakeLabels)
    })

    it('should forward error to next if getLabels throws', async () => {
      const err = new Error('get error')
      labelService.getLabels.mockRejectedValue(err)
      req.params = { id: 'c1' }

      await labelController.getLabels(req, res, next)

      expect(next).toHaveBeenCalledWith(err)
    })
  })

  describe('updateLabel', () => {
    it('should call labelService.updateLabel and return 200', async () => {
      const fakeUpdated = { _id: 'l1', name: 'Updated' }
      labelService.updateLabel.mockResolvedValue(fakeUpdated)
      req.params = { id: 'c1', labelId: 'l1' }
      req.body = { name: 'Updated' }

      await labelController.updateLabel(req, res, next)

      expect(labelService.updateLabel).toHaveBeenCalledWith('c1', 'l1', req.body)
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK)
      expect(res.json).toHaveBeenCalledWith(fakeUpdated)
    })

    it('should forward error to next if updateLabel throws', async () => {
      const err = new Error('update error')
      labelService.updateLabel.mockRejectedValue(err)
      req.params = { id: 'c1', labelId: 'l1' }

      await labelController.updateLabel(req, res, next)

      expect(next).toHaveBeenCalledWith(err)
    })
  })

  describe('deleteLabel', () => {
    it('should call labelService.deleteLabel and return 200', async () => {
      const fakeResult = { _destroy: true }
      labelService.deleteLabel.mockResolvedValue(fakeResult)
      req.params = { id: 'c1', labelId: 'l1' }

      await labelController.deleteLabel(req, res, next)

      expect(labelService.deleteLabel).toHaveBeenCalledWith('c1', 'l1')
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK)
      expect(res.json).toHaveBeenCalledWith(fakeResult)
    })

    it('should forward error to next if deleteLabel throws', async () => {
      const err = new Error('delete error')
      labelService.deleteLabel.mockRejectedValue(err)
      req.params = { id: 'c1', labelId: 'l1' }

      await labelController.deleteLabel(req, res, next)

      expect(next).toHaveBeenCalledWith(err)
    })
  })
})
