import { invitationModel } from '~/models/invitationModel'
import { GET_DB } from '~/config/database'
import { INVITATION_TYPE, BOARD_INVITATION_STATUS } from '~/utils/constants'
import { ObjectId } from 'mongodb'

const mockInsertOne = jest.fn()
const mockFindOne = jest.fn()
const mockFindOneAndUpdate = jest.fn()
const mockToArray = jest.fn()
const mockAggregate = jest.fn(() => ({ toArray: mockToArray }))

const mockCollection = {
  insertOne: mockInsertOne,
  findOne: mockFindOne,
  findOneAndUpdate: mockFindOneAndUpdate,
  aggregate: mockAggregate
}

const mockDb = {
  collection: jest.fn(() => mockCollection)
}

jest.mock('~/config/database', () => ({
  GET_DB: jest.fn(() => mockDb)
}))

describe('invitationModel', () => {
  const inviterId = new ObjectId().toString()
  const inviteeId = new ObjectId().toString()
  const boardId = new ObjectId().toString()
  const invitationId = new ObjectId().toString()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createNew', () => {
    it('should validate and insert invitation with boardInvitation', async () => {
      const insertedId = new ObjectId()
      mockInsertOne.mockResolvedValue({ insertedId })

      const result = await invitationModel.createNew({
        inviterId,
        inviteeId,
        type: INVITATION_TYPE.BOARD_INVITATION,
        boardInvitation: {
          boardId,
          status: BOARD_INVITATION_STATUS.PENDING
        }
      })

      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          inviterId: expect.any(ObjectId),
          inviteeId: expect.any(ObjectId),
          boardInvitation: expect.objectContaining({
            boardId: expect.any(ObjectId),
            status: BOARD_INVITATION_STATUS.PENDING
          })
        })
      )
      expect(result).toEqual({ insertedId })
    })

    it('should throw error on invalid data', async () => {
      await expect(invitationModel.createNew({ inviterId: 'invalid' })).rejects.toThrow()
    })
  })

  describe('findByUser', () => {
    it('should aggregate invitations for user', async () => {
      const fakeInvitations = [{ _id: invitationId }]
      mockToArray.mockResolvedValue(fakeInvitations)

      const result = await invitationModel.findByUser(inviteeId)

      expect(mockCollection.aggregate).toHaveBeenCalled()
      expect(result).toEqual(fakeInvitations)
    })
  })

  describe('findOneById and update', () => {
    it('should find invitation by id', async () => {
      const fakeInv = { _id: new ObjectId(invitationId) }
      mockFindOne.mockResolvedValue(fakeInv)

      const result = await invitationModel.findOneById(invitationId)

      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: new ObjectId(invitationId) })
      expect(result).toEqual(fakeInv)
    })

    it('should update invitation and set updatedAt', async () => {
      mockFindOneAndUpdate.mockResolvedValue({ _id: invitationId, status: 'ACCEPTED' })

      const result = await invitationModel.update(invitationId, {
        boardInvitation: { status: 'ACCEPTED' }
      })

      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: new ObjectId(invitationId) },
        expect.objectContaining({
          $set: expect.objectContaining({ updatedAt: expect.any(Number) })
        }),
        { returnDocument: 'after' }
      )
      expect(result).toBeDefined()
    })
  })
})
