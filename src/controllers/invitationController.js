import StatusCodes from 'http-status-codes'
import {
  invitationService
} from '~/services/invitationService'
const createdNew = async (req, res, next) => {
  try {
    const inviterId = req.jwtDecoded._id
    const createdInvitation = await invitationService.createNew(inviterId, req.body)
    res.status(StatusCodes.CREATED).json(createdInvitation)
  } catch (error) {
    next(error)
    // res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    //   errors: error.message
    // })
  }
}
const getInvitations = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const resInvitation = await invitationService.getInvitations(userId)
    res.status(StatusCodes.OK).json(resInvitation)
  } catch (error) {
    next(error)
    // res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    //   errors: error.message
    // })
  }
}
const update = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const invitationId = req.params.id
    const status = req.body.status
    const result = await invitationService.update(userId, invitationId, status)
    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
    // res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    //   errors: error.message
    // })
  }
}
export const invitationController = {
  createdNew,
  getInvitations,
  update
}