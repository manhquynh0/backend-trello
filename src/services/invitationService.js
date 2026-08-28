import {
  boardModel
} from '~/models/boardModel'
import {
  invitationModel
} from '~/models/invitationModel'
import {
  userModel
} from '~/models/userModel'
import ApiError from '~/utils/ApiError'
import {
  pickUser
} from '../utils/formatter'
import {
  INVITATION_TYPE,
  BOARD_INVITATION_STATUS
} from '~/utils/constants'
import { StatusCodes } from 'http-status-codes'
import { redisHelper } from '~/helpers/redisHelper'


const createNew = async (inviterId, reqBody) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const inviter = await userModel.findOneById(inviterId)
    const invitee = await userModel.findOneByEmail(reqBody.inviteeEmail)
    const board = await boardModel.findOneById(reqBody.boardId)
    if (!inviter || !invitee || !board) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Inviter, Invitee or Board not Found!!!')
    }

    const newInvitationData = {
      inviterId,
      inviteeId: invitee._id.toString(),
      type: INVITATION_TYPE.BOARD_INVITATION,
      boardInvitation: {
        boardId: board._id.toString(),
        status: BOARD_INVITATION_STATUS.PENDING
      }
    }
    const createdinvitation = await invitationModel.createNew(newInvitationData)

    const getNewInvitation = await invitationModel.findOneById(createdinvitation.insertedId)

    const resInvitation = {
      ...getNewInvitation,
      board,
      inviter: pickUser(inviter),
      invitee: pickUser(invitee)
    }
    return resInvitation
  } catch (error) {
    throw error
  }
}
const getInvitations = async (userId) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const getInvitations = await invitationModel.findByUser(userId)

    const resInvitations = getInvitations.map(item => {
      return {
        ...item,
        inviter: item.inviter[0] || {},
        invitee: item.invitee[0] || {},
        board: item.board[0] || {}
      }
    })
    return resInvitations
  } catch (error) {
    throw error
  }
}
const update = async (userId, invitationId, status) => {
  // eslint-disable-next-line no-useless-catch
  try {

    // Tìm bản ghi invitation được gửi tới userId
    const getinvitation = await invitationModel.findOneById(invitationId)
    if (!getinvitation) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Invitation not Found!!!')
    }
    // lấy thông tin của board từ getinvitation
    const boardId = getinvitation.boardInvitation.boardId
    const getBoard = await boardModel.findOneById(boardId)
    if (!getBoard) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Board not Found!!!')
    }
    // kiểm tra user có quyền truy cập board không
    const memberIds = (getBoard.memberIds || []).map(id => id.toString())
    const ownerIds = (getBoard.ownerIds || []).map(id => id.toString())
    const isMemberOrOwner = [...memberIds, ...ownerIds].includes(userId.toString())
    if (status === BOARD_INVITATION_STATUS.ACCEPTED && isMemberOrOwner) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'You are already a member of this board!!!')
    }

    const updateData = {
      boardInvitation: {
        ...getinvitation.boardInvitation,
        status: status
      }
    }

    // update status của invitation
    const updateinvitation = await invitationModel.update(invitationId, updateData)
    // add user vào board nếu status là accepted
    if (status === BOARD_INVITATION_STATUS.ACCEPTED) {
      await boardModel.pushMemberIds(boardId, userId)
      const key = `board:${boardId}`
      await redisHelper.del(key)
      await redisHelper.delByPattern('boards:*')
      await redisHelper.del('boards')
    }
    return updateinvitation
  } catch (error) {
    throw error
  }
}
export const invitationService = {
  createNew,
  getInvitations,
  update
}