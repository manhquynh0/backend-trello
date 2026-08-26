// src/middlewares/rabcMiddleware.js

import { roles, getAggregatedPermissions } from '~/config/rabcConfig'
import { boardModel } from '~/models/boardModel'
import { cardModel } from '~/models/cardModel'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'

export const verifyPermission = (requiredPermissions = []) => async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    let boardId = req.body.boardId
    let cardId = req.body.currentCardId || req.params.cardId

    if (req.params.id) {
      if (req.baseUrl?.includes('/cards')) {
        cardId = req.params.id // Với route /v1/cards/:id -> params.id chính là cardId
      } else if (req.baseUrl?.includes('/boards')) {
        boardId = req.params.id // Với route /v1/boards/:id -> params.id chính là boardId
      }
    }

    let board = null
    let card = null
    const userRoles = new Set() // Tập hợp các vai trò mà User đang sở hữu (Multi-roles)

    // 1. Kiểm tra vai trò trên Card (nếu có cardId)
    if (cardId) {
      card = await cardModel.findOneById(cardId)
      if (card) {
        if (card.memberIds?.some(id => id.toString() === userId)) {
          userRoles.add(roles.MEMBER_CARD) // Gán vai trò Member Card
        }
        // Nếu chưa có boardId thì lấy từ card.boardId
        if (!boardId && card.boardId) {
          board = await boardModel.findOneById(card.boardId)
        }
      }
    }

    // 2. Kiểm tra vai trò trên Board (nếu chưa tìm thấy board từ card ở trên)
    if (!board && boardId) {
      board = await boardModel.findOneById(boardId)
    }

    if (board) {
      if (board.ownerIds.some(id => id.toString() === userId)) {
        userRoles.add(roles.OWNER)
      }
      if (board.memberIds.some(id => id.toString() === userId)) {
        userRoles.add(roles.MEMBER)
      }
    }

    // 3. Nếu User không giữ bất kỳ vai trò nào (không thuộc Board lẫn Card nào)
    if (userRoles.size === 0) {
      return next(new ApiError(StatusCodes.FORBIDDEN, 'Bạn không phải là thành viên của Board hoặc Thẻ này!'))
    }

    // 4. NHÁNH ĐẶC BIỆT: THAM GIA / RỜI THẺ (incomingMemberInfo)
    // Thành viên của Board (roles.MEMBER) luôn có quyền Tham gia (Join) hoặc Rời (Leave) Thẻ
    if (userRoles.has(roles.MEMBER) && req.body.incomingMemberInfo) {
      return next()
    }

    // 5. MỨC 3: Tính toán danh sách quyền tổng hợp (bao gồm cả các quyền kế thừa từ ROLE_HIERARCHY)
    const aggregatedPermissions = getAggregatedPermissions(Array.from(userRoles))

    // 6. Kiểm tra xem userPermissions có chứa ĐẦY ĐỦ quyền yêu cầu không
    const hasPermission = requiredPermissions.every(perm => aggregatedPermissions.includes(perm))

    if (!hasPermission) {
      return next(new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền thực hiện hành động này!'))
    }

    next()
  } catch (error) {
    return next(new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message))
  }
}

