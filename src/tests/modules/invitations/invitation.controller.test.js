import { invitationController } from '~/controllers/invitationController'
import { invitationService } from '~/services/invitationService'
import { mockRequest, mockResponse, mockNext } from '~/tests/helpers/mockRequestResponse'
import { StatusCodes } from 'http-status-codes'

jest.mock('~/services/invitationService', () => ({
  invitationService: {
    createNew: jest.fn(),
    getInvitations: jest.fn(),
    update: jest.fn()
  }
}))

describe('invitationController', () => {
  let req
  let res
  let next
  const userId = 'user123'

  beforeEach(() => {
    jest.clearAllMocks()
    res = mockResponse()
    next = mockNext()
    req = mockRequest({
      jwtDecoded: { _id: userId }
    })
  })

  describe('createdNew', () => {
    it('should create invitation and return status 201', async () => {
      const fakeInvitation = { _id: 'inv1', status: 'PENDING' }
      invitationService.createNew.mockResolvedValue(fakeInvitation)
      req.body = { inviteeEmail: 'a@b.com', boardId: 'board1' }

      await invitationController.createdNew(req, res, next)

      expect(invitationService.createNew).toHaveBeenCalledWith(userId, req.body)
      expect(res.status).toHaveBeenCalledWith(StatusCodes.CREATED)
      expect(res.json).toHaveBeenCalledWith(fakeInvitation)
    })

    it('should catch error and call next', async () => {
      const error = new Error('Invite failed')
      invitationService.createNew.mockRejectedValue(error)

      await invitationController.createdNew(req, res, next)

      expect(next).toHaveBeenCalledWith(error)
    })
  })

  describe('getInvitations', () => {
    it('should return list of invitations with status 200', async () => {
      const fakeList = [{ _id: 'inv1' }, { _id: 'inv2' }]
      invitationService.getInvitations.mockResolvedValue(fakeList)

      await invitationController.getInvitations(req, res, next)

      expect(invitationService.getInvitations).toHaveBeenCalledWith(userId)
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK)
      expect(res.json).toHaveBeenCalledWith(fakeList)
    })

    it('should catch error and call next', async () => {
      const error = new Error('Get failed')
      invitationService.getInvitations.mockRejectedValue(error)

      await invitationController.getInvitations(req, res, next)

      expect(next).toHaveBeenCalledWith(error)
    })
  })

  describe('update', () => {
    it('should update invitation status and return 200', async () => {
      const updateResult = { _id: 'inv1', status: 'ACCEPTED' }
      invitationService.update.mockResolvedValue(updateResult)
      req.params = { id: 'inv1' }
      req.body = { status: 'ACCEPTED' }

      await invitationController.update(req, res, next)

      expect(invitationService.update).toHaveBeenCalledWith(userId, 'inv1', 'ACCEPTED')
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK)
      expect(res.json).toHaveBeenCalledWith(updateResult)
    })

    it('should catch error and call next', async () => {
      const error = new Error('Update failed')
      invitationService.update.mockRejectedValue(error)
      req.params = { id: 'inv1' }
      req.body = { status: 'ACCEPTED' }

      await invitationController.update(req, res, next)

      expect(next).toHaveBeenCalledWith(error)
    })
  })
})
