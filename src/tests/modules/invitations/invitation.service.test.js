import { invitationService } from '~/services/invitationService'
import { invitationModel } from '~/models/invitationModel'
import { boardModel } from '~/models/boardModel'
import { userModel } from '~/models/userModel'
import { redisHelper } from '~/helpers/redisHelper'
import { BOARD_INVITATION_STATUS, INVITATION_TYPE } from '~/utils/constants'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import { ObjectId } from 'mongodb'

jest.mock('~/models/invitationModel', () => ({
  invitationModel: {
    createNew: jest.fn(),
    findOneById: jest.fn(),
    findByUser: jest.fn(),
    update: jest.fn()
  }
}))

jest.mock('~/models/boardModel', () => ({
  boardModel: {
    findOneById: jest.fn(),
    pushMemberIds: jest.fn()
  }
}))

jest.mock('~/models/userModel', () => ({
  userModel: {
    findOneById: jest.fn(),
    findOneByEmail: jest.fn()
  }
}))

jest.mock('~/helpers/redisHelper', () => ({
  redisHelper: {
    del: jest.fn(),
    delByPattern: jest.fn()
  }
}))

describe('invitationService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createNew', () => {
    const inviterId = new ObjectId().toString()
    const inviteeId = new ObjectId().toString()
    const boardId = new ObjectId().toString()

    it('should throw 404 if inviter, invitee, or board does not exist', async () => {
      userModel.findOneById.mockResolvedValue(null)
      userModel.findOneByEmail.mockResolvedValue({ _id: inviteeId })
      boardModel.findOneById.mockResolvedValue({ _id: boardId })

      await expect(
        invitationService.createNew(inviterId, { inviteeEmail: 'b@test.com', boardId })
      ).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND,
        message: 'Inviter, Invitee or Board not Found!!!'
      })
    })

    it('should create invitation and return formatted response', async () => {
      const insertedId = new ObjectId()
      userModel.findOneById.mockResolvedValue({
        _id: new ObjectId(inviterId),
        email: 'inviter@test.com',
        username: 'inviter'
      })
      userModel.findOneByEmail.mockResolvedValue({
        _id: new ObjectId(inviteeId),
        email: 'invitee@test.com',
        username: 'invitee'
      })
      const fakeBoard = { _id: new ObjectId(boardId), title: 'Board 1' }
      boardModel.findOneById.mockResolvedValue(fakeBoard)

      invitationModel.createNew.mockResolvedValue({ insertedId })
      const fakeCreatedInvitation = {
        _id: insertedId,
        inviterId,
        inviteeId,
        type: INVITATION_TYPE.BOARD_INVITATION
      }
      invitationModel.findOneById.mockResolvedValue(fakeCreatedInvitation)

      const result = await invitationService.createNew(inviterId, {
        inviteeEmail: 'invitee@test.com',
        boardId
      })

      expect(invitationModel.createNew).toHaveBeenCalledWith({
        inviterId,
        inviteeId,
        type: INVITATION_TYPE.BOARD_INVITATION,
        boardInvitation: {
          boardId,
          status: BOARD_INVITATION_STATUS.PENDING
        }
      })
      expect(result.board).toEqual(fakeBoard)
      expect(result.inviter).toBeDefined()
      expect(result.invitee).toBeDefined()
    })
  })

  describe('getInvitations', () => {
    it('should return mapped list of user invitations', async () => {
      const fakeList = [
        {
          _id: 'inv1',
          inviter: [{ username: 'u1' }],
          invitee: [{ username: 'u2' }],
          board: [{ title: 'b1' }]
        }
      ]
      invitationModel.findByUser.mockResolvedValue(fakeList)

      const result = await invitationService.getInvitations('user1')

      expect(result[0].inviter).toEqual({ username: 'u1' })
      expect(result[0].invitee).toEqual({ username: 'u2' })
      expect(result[0].board).toEqual({ title: 'b1' })
    })
  })

  describe('update', () => {
    const userId = new ObjectId().toString()
    const invitationId = new ObjectId().toString()
    const boardId = new ObjectId().toString()

    it('should throw 404 if invitation not found', async () => {
      invitationModel.findOneById.mockResolvedValue(null)

      await expect(
        invitationService.update(userId, invitationId, BOARD_INVITATION_STATUS.ACCEPTED)
      ).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND,
        message: 'Invitation not Found!!!'
      })
    })

    it('should throw 404 if board not found', async () => {
      invitationModel.findOneById.mockResolvedValue({
        boardInvitation: { boardId }
      })
      boardModel.findOneById.mockResolvedValue(null)

      await expect(
        invitationService.update(userId, invitationId, BOARD_INVITATION_STATUS.ACCEPTED)
      ).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND,
        message: 'Board not Found!!!'
      })
    })

    it('should throw 406 NOT_ACCEPTABLE if user is already a member/owner', async () => {
      invitationModel.findOneById.mockResolvedValue({
        boardInvitation: { boardId }
      })
      boardModel.findOneById.mockResolvedValue({
        _id: new ObjectId(boardId),
        memberIds: [new ObjectId(userId)],
        ownerIds: []
      })

      await expect(
        invitationService.update(userId, invitationId, BOARD_INVITATION_STATUS.ACCEPTED)
      ).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_ACCEPTABLE,
        message: 'You are already a member of this board!!!'
      })
    })

    it('should accept invitation, push member into board, and clear redis cache', async () => {
      invitationModel.findOneById.mockResolvedValue({
        boardInvitation: { boardId, status: BOARD_INVITATION_STATUS.PENDING }
      })
      boardModel.findOneById.mockResolvedValue({
        _id: new ObjectId(boardId),
        memberIds: [],
        ownerIds: []
      })
      invitationModel.update.mockResolvedValue({ updated: true })

      const result = await invitationService.update(
        userId,
        invitationId,
        BOARD_INVITATION_STATUS.ACCEPTED
      )

      expect(boardModel.pushMemberIds).toHaveBeenCalledWith(boardId, userId)
      expect(redisHelper.del).toHaveBeenCalledWith(`board:${boardId}`)
      expect(redisHelper.delByPattern).toHaveBeenCalledWith('boards:*')
      expect(redisHelper.del).toHaveBeenCalledWith('boards')
      expect(result).toEqual({ updated: true })
    })

    it('should update invitation when status is REJECTED without pushing member', async () => {
      invitationModel.findOneById.mockResolvedValue({
        boardInvitation: { boardId, status: BOARD_INVITATION_STATUS.PENDING }
      })
      boardModel.findOneById.mockResolvedValue({
        _id: new ObjectId(boardId),
        memberIds: [],
        ownerIds: []
      })
      invitationModel.update.mockResolvedValue({ updated: true })

      const result = await invitationService.update(
        userId,
        invitationId,
        BOARD_INVITATION_STATUS.REJECTED
      )

      expect(boardModel.pushMemberIds).not.toHaveBeenCalled()
      expect(result).toEqual({ updated: true })
    })
  })
})
