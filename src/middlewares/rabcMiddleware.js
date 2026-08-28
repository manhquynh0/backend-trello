// src/middlewares/rabcMiddleware.js

import { roles, getAggregatedPermissions } from '~/config/rabcConfig'
import { boardModel } from '~/models/boardModel'
import { cardModel } from '~/models/cardModel'
import { columnModel } from '~/models/columnModel'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'

export const verifyPermission = (requiredPermissions = []) => async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    let boardId = req.params.boardId || req.body?.boardId || req.query?.boardId || null
    let cardId = req.params.cardId || req.body?.cardId || req.body?.currentCardId || req.query?.cardId || null
    let columnId = req.params.columnId || req.body?.columnId || req.query?.columnId || null

    if (req.params.id) {
      if (req.baseUrl?.includes('/cards')) {
        cardId = req.params.id // Với route /v1/cards/:id -> params.id chính là cardId
      } else if (req.baseUrl?.includes('/boards')) {
        boardId = req.params.id // Với route /v1/boards/:id -> params.id chính là boardId
      } else if (req.baseUrl?.includes('/columns')) {
        columnId = req.params.id // Với route /v1/columns/:id -> params.id chính là columnId
      }
    }
    let board = null
    let card = null
    let column = null
    const userRoles = new Set() // Tập hợp các vai trò mà User đang sở hữu (Multi-roles)

    // 1. Kiểm tra nếu có columnId -> Tự động tìm boardId từ thông tin Column
    if (columnId && !boardId) {
      column = await columnModel.findOneById(columnId)
      if (column?.boardId) {
        boardId = column.boardId.toString()
      }
    }

    // 2. Kiểm tra vai trò trên Card (nếu có cardId)
    if (cardId) {
      card = await cardModel.findOneById(cardId)
      if (card) {
        if (card.memberIds?.some(id => id.toString() === userId)) {
          userRoles.add(roles.MEMBER_CARD) // Gán vai trò Member Card
        }
        // Tự động lấy luôn boardId từ thông tin Card nếu chưa có boardId
        if (!boardId && card.boardId) {
          boardId = card.boardId.toString()
        }
      }
    }

    // 3. Kiểm tra vai trò trên Board
    if (!board && boardId) {
      board = await boardModel.findOneById(boardId)
    }

    if (board) {
      if (board.ownerIds?.some(id => id.toString() === userId)) {
        userRoles.add(roles.OWNER)
      }
      if (board.memberIds?.some(id => id.toString() === userId)) {
        userRoles.add(roles.MEMBER)
      }
    }
    console.log(userRoles)

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

