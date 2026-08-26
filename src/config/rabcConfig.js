// Định nghĩa các roles của user

export const roles = {
  OWNER: 'owner',
  MEMBER: 'member',
  MEMBER_CARD: 'member_card'
}
// Định nghĩa các quyền của user
export const permission = {
  UPDATE_COLUMN: 'update_column',
  DELETE_COLUMN: 'delete_column',
  UPDATE_CARD: 'update_card',
  CREATE_CARD: 'create_card',
  CREATE_COLUMN: 'create_column',
  MOVE_COLUMN: 'move_column',
  MOVE_CARD: 'move_card',
  INVITE_MEMBER_TO_BOARD: 'invite_member_to_board'
}
// Định nghĩa quyền theo từng role
export const rolePermission = {
  [roles.OWNER]: Object.values(permission),
  [roles.MEMBER]: [
    permission.MOVE_COLUMN,
    permission.CREATE_COLUMN,
    permission.MOVE_CARD
  ],
  [roles.MEMBER_CARD]: [
    permission.UPDATE_CARD,
    permission.MOVE_CARD
  ]
}
// MEMBER_CARD kế thừa tất cả các quyền của MEMBER (Member Board)
// OWNER kế thừa tất cả các quyền của MEMBER
export const ROLE_HIERARCHY = { // HỆ THỐNG PHÂN CẤP VAI TRÒ
  [roles.MEMBER_CARD]: [roles.MEMBER] // Member Card tự động kế thừa Member Board
}

// 3. MỨC 3: Hàm lấy tất cả Roles kế thừa (Đệ quy)
export const getExpandedRoles = (userRoles = []) => { // truyền vào role ban đầu của user
  const expanded = new Set(userRoles) // tạo hàm Set để luu role
  userRoles.forEach(role => { // lặp qua từng role của user
    const inheritedRoles = ROLE_HIERARCHY[role] || [] // lấy role kế thừa
    inheritedRoles.forEach(parentRole => { // lặp qua từng role kế thừa
      expanded.add(parentRole)
      getExpandedRoles([parentRole]).forEach(r => expanded.add(r)) // Lấy tiếp tầng kế thừa sâu hơn nếu có
    })
  })
  return Array.from(expanded)
}
// 4. MỨC 3: Hàm tổng hợp toàn bộ Quyền hạn (bao gồm quyền kế thừa)
export const getAggregatedPermissions = (userRoles = []) => {
  const allRoles = getExpandedRoles(userRoles) // Lấy tất cả các role
  const permissions = new Set()
  allRoles.forEach(role => {
    const perms = rolePermission[role] || [] // lấy quyền của từng role
    perms.forEach(p => permissions.add(p)) // thêm quyền vào Set để loại bỏ trùng lặp
  })
  return Array.from(permissions)
}


